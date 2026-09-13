// Parser and mapper unit tests. These are pure: no database.
import { describe, it, expect } from "vitest";
import {
  parseCsv, parseCsvWithLimits, parseDateWithFormat, parseAmount, mapRow, mapRows,
  validateColumnMapping, dedupeHash, normalizeDescription, MAX_IMPORT_ROWS, ImportTooLargeError,
} from "@/lib/csv";
import { ValidationError } from "@/lib/categories";

describe("parseCsv, RFC 4180", () => {
  it("parses a plain file", () => {
    const { headers, rows } = parseCsv("date,desc,amt\n2026-01-02,Coffee,4.50");
    expect(headers).toEqual(["date", "desc", "amt"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].fields).toEqual(["2026-01-02", "Coffee", "4.50"]);
  });

  it("keeps commas inside quoted fields", () => {
    const { rows } = parseCsv('a,b\n"Smith, John",5');
    expect(rows[0].fields).toEqual(["Smith, John", "5"]);
  });

  it("keeps newlines inside quoted fields", () => {
    const { rows } = parseCsv('a,b\n"line one\nline two",5');
    expect(rows[0].fields[0]).toBe("line one\nline two");
  });

  it("unescapes doubled quotes", () => {
    const { rows } = parseCsv('a,b\n"He said ""hi""",5');
    expect(rows[0].fields[0]).toBe('He said "hi"');
  });

  it("handles CRLF line endings", () => {
    const { headers, rows } = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(headers).toEqual(["a", "b"]);
    expect(rows.map((r) => r.fields)).toEqual([["1", "2"], ["3", "4"]]);
  });

  it("strips a UTF-8 byte order mark from the first header", () => {
    const { headers } = parseCsv("﻿date,desc\n2026-01-02,x");
    expect(headers[0]).toBe("date");
  });

  it("ignores a trailing blank line", () => {
    const { rows } = parseCsv("a,b\n1,2\n");
    expect(rows).toHaveLength(1);
  });

  it("reports the real file line number, not the row index", () => {
    const { rows } = parseCsv('a,b\n"x\ny",2\n3,4');
    // The quoted field spans lines 2-3, so the next record starts at line 4.
    expect(rows[1].line).toBe(4);
  });

  it("rejects a file with more rows than the cap", () => {
    const big = "a,b\n" + Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => "1,2").join("\n");
    expect(() => parseCsvWithLimits(big)).toThrow(ImportTooLargeError);
  });
});

describe("parseDateWithFormat", () => {
  it("parses each format explicitly rather than guessing", () => {
    expect(parseDateWithFormat("2026-03-04", "iso")).toBe("2026-03-04");
    expect(parseDateWithFormat("03/04/2026", "us")).toBe("2026-03-04");
    expect(parseDateWithFormat("03/04/2026", "eu")).toBe("2026-04-03");
  });

  it("rejects an impossible calendar date", () => {
    expect(parseDateWithFormat("2026-02-30", "iso")).toBeNull();
    expect(parseDateWithFormat("13/01/2026", "us")).toBeNull();
  });
});

describe("parseAmount", () => {
  it("handles symbols, separators and parentheses", () => {
    expect(parseAmount("$1,234.56")).toBe(1234.56);
    expect(parseAmount("(45.00)")).toBe(-45);
    expect(parseAmount("-12.30")).toBe(-12.3);
    expect(parseAmount("  7 ")).toBe(7);
  });

  it("rejects junk", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("treats a three digit tail as a thousands group", () => {
    expect(parseAmount("1.234")).toBe(1234);
    expect(parseAmount("1,234")).toBe(1234);
  });

  // Folding a longer tail into the integer part multiplied the amount by a
  // power of ten: 1.2345 became 12345. A thousands group is always exactly
  // three digits, so anything longer is refused and reported per row.
  it("refuses a tail longer than three digits instead of misreading it", () => {
    expect(parseAmount("1.2345")).toBeNull();
    expect(parseAmount("0.005")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("12.")).toBeNull();
  });
});

const single = (signConvention: string) =>
  validateColumnMapping({ dateColumn: 0, dateFormat: "iso", descriptionColumn: 1, amountMode: "single", amountColumn: 2, signConvention }, 4);

describe("mapRow sign convention", () => {
  it("expense_positive keeps the file's sign (positive is money out)", () => {
    const r = mapRow({ line: 2, fields: ["2026-01-02", "Coffee", "4.50"] }, single("expense_positive"));
    expect(r.ok && r.row.amount).toBe(4.5);
  });

  it("income_positive flips it", () => {
    const r = mapRow({ line: 2, fields: ["2026-01-02", "Salary", "1000"] }, single("income_positive"));
    expect(r.ok && r.row.amount).toBe(-1000);
  });

  it("debit/credit columns become out positive, in negative", () => {
    const m = validateColumnMapping(
      { dateColumn: 0, dateFormat: "iso", descriptionColumn: 1, amountMode: "debit_credit", debitColumn: 2, creditColumn: 3 }, 4);
    const out = mapRow({ line: 2, fields: ["2026-01-02", "Rent", "900", ""] }, m);
    const inn = mapRow({ line: 3, fields: ["2026-01-03", "Refund", "", "50"] }, m);
    expect(out.ok && out.row.amount).toBe(900);
    expect(inn.ok && inn.row.amount).toBe(-50);
  });
});

describe("mapRows error handling", () => {
  it("reports a malformed row by line and keeps the rest", () => {
    const m = single("expense_positive");
    const { valid, errors } = mapRows(
      [
        { line: 2, fields: ["2026-01-02", "Good", "1.00"] },
        { line: 3, fields: ["not-a-date", "Bad", "2.00"] },
        { line: 4, fields: ["2026-01-04", "Also good", "3.00"] },
      ],
      m,
    );
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(3);
  });
});

describe("validateColumnMapping", () => {
  it("rejects an unknown field and an out of range column", () => {
    expect(() => validateColumnMapping({ nope: 1 }, 3)).toThrow(ValidationError);
    expect(() => validateColumnMapping(
      { dateColumn: 9, dateFormat: "iso", descriptionColumn: 1, amountMode: "single", amountColumn: 2, signConvention: "expense_positive" }, 3,
    )).toThrow(ValidationError);
  });
});

describe("dedupeHash", () => {
  it("ignores case and whitespace in the description", () => {
    expect(dedupeHash("2026-01-02", 4.5, "  COFFEE   SHOP ")).toBe(dedupeHash("2026-01-02", 4.5, "coffee shop"));
  });

  it("separates identical rows by their occurrence in the file", () => {
    const first = dedupeHash("2026-01-02", 4.5, "Coffee", 0);
    const second = dedupeHash("2026-01-02", 4.5, "Coffee", 1);
    expect(first).not.toBe(second);
    // Deterministic, so re-importing the same file still matches.
    expect(dedupeHash("2026-01-02", 4.5, "Coffee", 1)).toBe(second);
  });

  it("separates rows that differ in date or amount", () => {
    expect(dedupeHash("2026-01-02", 4.5, "x")).not.toBe(dedupeHash("2026-01-03", 4.5, "x"));
    expect(dedupeHash("2026-01-02", 4.5, "x")).not.toBe(dedupeHash("2026-01-02", 4.51, "x"));
  });

  it("normalizeDescription collapses runs of whitespace", () => {
    expect(normalizeDescription("A   B\tC")).toBe("a b c");
  });
});
