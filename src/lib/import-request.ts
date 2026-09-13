// Shared request handling for the two import routes: both take the same
// { accountId, csv, mapping } body, so they parse and validate identically
// and differ only in whether they write.
import { ValidationError } from "./categories";
import {
  ImportTooLargeError,
  MAX_IMPORT_BYTES,
  parseCsvWithLimits,
  validateColumnMapping,
  type ColumnMapping,
  type CsvRecord,
} from "./csv";

const BODY_FIELDS = new Set(["accountId", "csv", "mapping"]);

export type ImportRequest = { accountId: number; records: CsvRecord[]; headers: string[]; mapping: ColumnMapping };

export function parseImportBody(body: unknown): ImportRequest {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!BODY_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const accountId = obj.accountId;
  if (typeof accountId !== "number" || !Number.isInteger(accountId) || accountId <= 0) {
    throw new ValidationError("accountId must be a positive integer.");
  }
  const csv = obj.csv;
  if (typeof csv !== "string") throw new ValidationError("csv must be a string.");
  // Byte length, not string length: the cap is about upload size, and a
  // multi-byte description would otherwise slip past a .length check.
  if (Buffer.byteLength(csv, "utf8") > MAX_IMPORT_BYTES) {
    throw new ImportTooLargeError(`file exceeds ${MAX_IMPORT_BYTES} bytes.`);
  }

  const { headers, rows } = parseCsvWithLimits(csv);
  const mapping = validateColumnMapping(obj.mapping, headers.length);
  return { accountId, records: rows, headers, mapping };
}

// Translates the import pipeline's error types into HTTP responses. Size
// and row-count overruns are 413; everything else validation-shaped is 400.
export function importErrorResponse(e: unknown): Response | null {
  if (e instanceof ImportTooLargeError) return Response.json({ error: e.message }, { status: 413 });
  if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
  return null;
}
