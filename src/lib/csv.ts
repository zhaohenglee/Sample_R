// Hand written RFC 4180 CSV parser and column mapper for T6.1 CSV import.
// No dependency beyond the parser itself -- everything below is plain
// string handling. Server only (imports ValidationError/manual constants,
// which pull in "@/db"): this module is never bundled for the browser, the
// client just posts raw CSV text to the /api/import/* routes.
import { ValidationError } from "./categories";
import { isValidCalendarDate, MAX_ABS_AMOUNT, MAX_DESCRIPTION_LEN } from "./manual";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMPORT_ROWS = 10000;

// Thrown for an over-size or over-row-count upload. Route handlers
// translate this to 413.
export class ImportTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportTooLargeError";
  }
}

// ---------------------------------------------------------------------------
// RFC 4180 parsing
// ---------------------------------------------------------------------------

export type CsvRecord = { line: number; fields: string[] };
export type ParsedCsv = { headers: string[]; rows: CsvRecord[] };

// A single left-to-right scan, one character at a time. `line` tracks the
// 1-based source line currently being consumed; `recordStartLine` is
// captured when a record begins, so a field with an embedded newline still
// reports the line the record *started* on, not the line the closing quote
// happened to land on. \r\n and a lone \r or \n are all treated as one line
// break, both inside and outside quotes. "" inside a quoted field is an
// escaped literal quote. A wholly blank line (no characters and no fields
// at all) is not emitted as a record -- this is what makes a trailing
// blank line at end of file a no-op instead of a spurious empty row.
function parseCsvRecords(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  const n = text.length;
  let i = 0;
  let line = 1;
  let recordStartLine = 1;
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let sawContent = false;

  const endField = () => {
    fields.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    records.push({ line: recordStartLine, fields });
    fields = [];
  };

  while (i < n) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      if (ch === "\r" || ch === "\n") {
        field += "\n";
        if (ch === "\r" && text[i + 1] === "\n") i += 2;
        else i += 1;
        line += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      sawContent = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endField();
      sawContent = true;
      i += 1;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i += 1;
      line += 1;
      if (sawContent || field.length > 0 || fields.length > 0) endRecord();
      sawContent = false;
      recordStartLine = line;
      continue;
    }
    field += ch;
    sawContent = true;
    i += 1;
  }

  // Flush a final record with no trailing newline. A wholly blank tail
  // (the trailing-blank-line case) leaves sawContent/field/fields all
  // empty here and is correctly dropped.
  if (sawContent || field.length > 0 || fields.length > 0) endRecord();

  return records;
}

// Strips a UTF-8 byte order mark (common from Excel exports) if present,
// parses the rest, and splits the first record off as headers. An empty
// file yields no headers and no rows.
export function parseCsv(text: string): ParsedCsv {
  const stripped = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records = parseCsvRecords(stripped);
  if (records.length === 0) return { headers: [], rows: [] };
  const [header, ...rows] = records;
  return { headers: header.fields, rows };
}

function assertWithinByteLimit(text: string): void {
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes > MAX_IMPORT_BYTES) {
    throw new ImportTooLargeError(`CSV file exceeds the ${MAX_IMPORT_BYTES / (1024 * 1024)}MB size limit.`);
  }
}

function assertRowCountWithinLimit(count: number): void {
  if (count > MAX_IMPORT_ROWS) {
    throw new ImportTooLargeError(`CSV file exceeds the ${MAX_IMPORT_ROWS} row limit.`);
  }
}

// Checks the raw byte size before parsing (cheap, avoids ever tokenizing an
// oversize payload) and the data row count after. Both preview and commit
// go through this single function so the two can never disagree about the
// cap.
export function parseCsvWithLimits(text: string): ParsedCsv {
  assertWithinByteLimit(text);
  const parsed = parseCsv(text);
  assertRowCountWithinLimit(parsed.rows.length);
  return parsed;
}

// ---------------------------------------------------------------------------
// Date parsing -- format is always chosen explicitly by the mapping, never
// guessed from the data.
// ---------------------------------------------------------------------------

export type DateFormat = "iso" | "us" | "eu";
export const DATE_FORMATS: readonly DateFormat[] = ["iso", "us", "eu"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Reuses manual.ts's isValidCalendarDate for the actual calendar-validity
// check (real day-of-month, real leap years, ...) so there is exactly one
// definition of "a real date" across manual entry and CSV import.
export function parseDateWithFormat(raw: string, format: DateFormat): string | null {
  const s = raw.trim();
  let y: number, m: number, d: number;

  if (format === "iso") {
    const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
    if (!match) return null;
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  } else {
    const match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
    if (!match) return null;
    if (format === "us") {
      m = Number(match[1]);
      d = Number(match[2]);
    } else {
      d = Number(match[1]);
      m = Number(match[2]);
    }
    y = Number(match[3]);
  }

  const iso = `${y}-${pad2(m)}-${pad2(d)}`;
  return isValidCalendarDate(iso) ? iso : null;
}

// ---------------------------------------------------------------------------
// Amount parsing -- currency symbols, thousands separators, parentheses for
// negatives.
// ---------------------------------------------------------------------------

// Returns the raw magnitude with its sign as written (parentheses or a
// leading/trailing minus make it negative); mapRow below is what converts
// that into Plaid's sign convention according to the chosen mapping.
export function parseAmount(raw: string): number | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (s === "") return null;

  let negative = false;
  const paren = /^\((.*)\)$/.exec(s);
  if (paren) {
    negative = true;
    s = paren[1].trim();
  }

  // A leading or trailing ISO 4217 style code ("USD 4.50", "4.50 EUR") is a
  // currency label, not part of the number, so drop it.
  s = s.replace(/^[A-Za-z]{3}\s*/, "").replace(/\s*[A-Za-z]{3}$/, "");
  // Any other letter means this is not an amount. Stripping letters instead
  // would silently turn "1e3" into 13, which is the kind of quiet
  // mis-reading that puts a wrong number in someone's ledger. Refuse and
  // let the caller report the row.
  if (/[A-Za-z]/.test(s)) return null;

  // Strip currency symbols and anything else that isn't a digit, a
  // separator, or a sign.
  s = s.replace(/[^0-9.,-]/g, "");
  if (s === "") return null;

  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.includes("-")) return null; // a stray minus anywhere else is not understood

  let intPart = s;
  let fracPart = "";
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const sepIndex = Math.max(lastDot, lastComma);
  if (sepIndex !== -1) {
    intPart = s.slice(0, sepIndex);
    fracPart = s.slice(sepIndex + 1);
    // A three digit tail is genuinely ambiguous: "1.234" is a thousands
    // group in EU notation and 1.234 in US notation. Resolve it the way
    // common accounting parsers do, as a thousands group, which is far more
    // likely in a bank export -- but only when the integer part could
    // really precede a group. "0.005" cannot ("0,005" is not a number
    // anyone writes), so it stays a sub-cent value and is refused below.
    const groupsPlausibly = fracPart.length === 3 && intPart !== "" && !/^0/.test(intPart.replace(/[.,]/g, ""));
    if (groupsPlausibly) {
      intPart = intPart + fracPart;
      fracPart = "";
    } else if (fracPart.length !== 1 && fracPart.length !== 2) {
      // A thousands group is always exactly three digits, so a longer tail
      // is not one. Folding it would multiply the amount by a power of ten
      // ("1.2345" became 12345), so refuse instead and let the caller
      // report the row. A trailing separator with no digits is junk too.
      return null;
    }
  }
  intPart = intPart.replace(/[.,]/g, "");
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return null;
  if (intPart === "" && fracPart === "") return null;

  const numeric = Number(`${intPart || "0"}.${fracPart || "0"}`);
  if (!Number.isFinite(numeric)) return null;
  return negative ? -numeric : numeric;
}

// ---------------------------------------------------------------------------
// Column mapping
// ---------------------------------------------------------------------------

// "expense_positive": the amount column's positive values are spending
// (already Plaid convention, positive = money out). "income_positive": the
// file's positive values are income, so the mapping flips the sign.
export type SignConvention = "expense_positive" | "income_positive";

export type AmountMapping =
  | { mode: "single"; column: number; signConvention: SignConvention }
  | { mode: "debit_credit"; debitColumn: number; creditColumn: number };

export type ColumnMapping = {
  dateColumn: number;
  dateFormat: DateFormat;
  descriptionColumn: number;
  amount: AmountMapping;
};

const MAPPING_FIELDS = new Set([
  "dateColumn",
  "dateFormat",
  "descriptionColumn",
  "amountMode",
  "amountColumn",
  "signConvention",
  "debitColumn",
  "creditColumn",
]);
const SIGN_CONVENTIONS = new Set<string>(["expense_positive", "income_positive"]);

// Validates and normalizes a raw JSON mapping body into a ColumnMapping.
// `headerCount` bounds every column index -- a column choice must refer to
// an actual column in the uploaded file.
export function validateColumnMapping(body: unknown, headerCount: number): ColumnMapping {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("mapping must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!MAPPING_FIELDS.has(key)) throw new ValidationError(`Unknown mapping field "${key}".`);
  }
  if (headerCount <= 0) throw new ValidationError("CSV has no header row to map columns from.");

  function column(name: string): number {
    const raw = obj[name];
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw >= headerCount) {
      throw new ValidationError(`${name} must be an integer column index between 0 and ${headerCount - 1}.`);
    }
    return raw;
  }

  const dateColumn = column("dateColumn");
  if (typeof obj.dateFormat !== "string" || !DATE_FORMATS.includes(obj.dateFormat as DateFormat)) {
    throw new ValidationError('dateFormat must be one of "iso", "us", "eu".');
  }
  const dateFormat = obj.dateFormat as DateFormat;
  const descriptionColumn = column("descriptionColumn");

  if (obj.amountMode !== "single" && obj.amountMode !== "debit_credit") {
    throw new ValidationError('amountMode must be "single" or "debit_credit".');
  }

  let amount: AmountMapping;
  if (obj.amountMode === "single") {
    const amountColumn = column("amountColumn");
    if (typeof obj.signConvention !== "string" || !SIGN_CONVENTIONS.has(obj.signConvention)) {
      throw new ValidationError('signConvention must be "expense_positive" or "income_positive".');
    }
    amount = { mode: "single", column: amountColumn, signConvention: obj.signConvention as SignConvention };
  } else {
    const debitColumn = column("debitColumn");
    const creditColumn = column("creditColumn");
    amount = { mode: "debit_credit", debitColumn, creditColumn };
  }

  return { dateColumn, dateFormat, descriptionColumn, amount };
}

// ---------------------------------------------------------------------------
// Mapping a record into a transaction candidate
// ---------------------------------------------------------------------------

export type MappedRow = { line: number; date: string; description: string; amount: number };
export type RowError = { line: number; error: string };
export type MapRowResult = { ok: true; row: MappedRow } | { ok: false; error: string };

function maxMappedColumn(mapping: ColumnMapping): number {
  const amountCols =
    mapping.amount.mode === "single" ? [mapping.amount.column] : [mapping.amount.debitColumn, mapping.amount.creditColumn];
  return Math.max(mapping.dateColumn, mapping.descriptionColumn, ...amountCols);
}

// Maps one CSV record into a transaction candidate, or a per-row error
// (never throws) -- callers report the error against `record.line` and
// move on to the next row rather than aborting the whole import.
export function mapRow(record: CsvRecord, mapping: ColumnMapping): MapRowResult {
  const { fields } = record;
  const maxCol = maxMappedColumn(mapping);
  if (fields.length <= maxCol) {
    return { ok: false, error: `row has ${fields.length} column(s), but the mapping needs at least ${maxCol + 1}.` };
  }

  const rawDate = fields[mapping.dateColumn] ?? "";
  const date = parseDateWithFormat(rawDate, mapping.dateFormat);
  if (!date) return { ok: false, error: `could not parse date "${rawDate}".` };

  const description = (fields[mapping.descriptionColumn] ?? "").trim();
  if (!description) return { ok: false, error: "description is empty." };
  if (description.length > MAX_DESCRIPTION_LEN) {
    return { ok: false, error: `description exceeds ${MAX_DESCRIPTION_LEN} characters.` };
  }

  let amount: number;
  if (mapping.amount.mode === "single") {
    const raw = fields[mapping.amount.column] ?? "";
    const parsed = parseAmount(raw);
    if (parsed === null) return { ok: false, error: `could not parse amount "${raw}".` };
    // Convert to Plaid convention (positive = money out).
    amount = mapping.amount.signConvention === "expense_positive" ? parsed : -parsed;
  } else {
    const rawDebit = fields[mapping.amount.debitColumn] ?? "";
    const rawCredit = fields[mapping.amount.creditColumn] ?? "";
    const debit = rawDebit.trim() === "" ? 0 : parseAmount(rawDebit);
    const credit = rawCredit.trim() === "" ? 0 : parseAmount(rawCredit);
    if (debit === null || credit === null) {
      return { ok: false, error: `could not parse debit/credit amount ("${rawDebit}" / "${rawCredit}").` };
    }
    if (debit === 0 && credit === 0) return { ok: false, error: "both debit and credit are empty." };
    // Plaid convention: a debit (money out) is positive, a credit (money
    // in) is negative. Magnitudes are used regardless of any sign already
    // present in the source columns, since debit/credit columns are
    // conventionally unsigned.
    amount = Math.abs(debit) - Math.abs(credit);
  }

  if (!Number.isFinite(amount) || Math.abs(amount) > MAX_ABS_AMOUNT) {
    return { ok: false, error: "amount is out of range." };
  }
  amount = Math.round(amount * 100) / 100;

  return { ok: true, row: { line: record.line, date, description, amount } };
}

// Maps every record, collecting valid rows and per-row errors separately.
// A malformed row never aborts the rest of the import.
export function mapRows(records: CsvRecord[], mapping: ColumnMapping): { valid: MappedRow[]; errors: RowError[] } {
  const valid: MappedRow[] = [];
  const errors: RowError[] = [];
  for (const record of records) {
    const result = mapRow(record, mapping);
    if (result.ok) valid.push(result.row);
    else errors.push({ line: record.line, error: result.error });
  }
  return { valid, errors };
}

export type PreviewRow =
  | { line: number; ok: true; date: string; description: string; amount: number }
  | { line: number; ok: false; error: string };

// The mapping screen's 10 row preview: maps just the first `limit` records
// (in file order) and reports each one's parsed result or error inline.
export function previewRows(records: CsvRecord[], mapping: ColumnMapping, limit = 10): PreviewRow[] {
  return records.slice(0, limit).map((record) => {
    const result = mapRow(record, mapping);
    return result.ok
      ? { ok: true as const, ...result.row }
      : { line: record.line, ok: false as const, error: result.error };
  });
}

// ---------------------------------------------------------------------------
// Dedupe hash
// ---------------------------------------------------------------------------

export function normalizeDescription(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A hash of (date, amount, normalized description, occurrence). Re-importing
// the same file produces the exact same key for every row, so a second pass
// recognizes and skips all of them.
//
// `occurrence` is what stops two genuinely distinct but identical-looking
// rows -- two $4.50 coffees on the same day, two identical transit fares --
// from collapsing into one and silently shortening the ledger. It is the
// zero based index of this row among identical rows within a single file,
// so it is deterministic: the same file re-imported yields the same
// occurrences and still matches every stored row. Two independent 32-bit FNV-1a passes
// (one over the key, one over its reverse) are concatenated into a 64-bit
// hex string -- collision-resistant enough for a personal ledger's row
// count without pulling in a crypto dependency for what is really just a
// lookup key, never stored or verified as a security property.
export function dedupeHash(date: string, amount: number, description: string, occurrence = 0): string {
  const key = `${date}|${amount.toFixed(2)}|${normalizeDescription(description)}|${occurrence}`;
  const a = fnv1a(key, 0x811c9dc5).toString(16).padStart(8, "0");
  const b = fnv1a([...key].reverse().join(""), 0x9e3779b9).toString(16).padStart(8, "0");
  return a + b;
}
