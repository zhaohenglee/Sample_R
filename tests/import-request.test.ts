// Route-level input handling for the import endpoints. The size and row
// caps and the 413 mapping had no coverage: every one of these guards
// survived removal with the rest of the suite green.
import { describe, it, expect } from "vitest";
import { parseImportBody, importErrorResponse } from "@/lib/import-request";
import { ImportTooLargeError, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from "@/lib/csv";
import { ValidationError } from "@/lib/categories";

const MAPPING = {
  dateColumn: 0, dateFormat: "iso", descriptionColumn: 1,
  amountMode: "single", amountColumn: 2, signConvention: "expense_positive",
};
const body = (over: Record<string, unknown> = {}) => ({
  accountId: 1,
  csv: "date,description,amount\n2026-01-02,Coffee,4.50",
  mapping: MAPPING,
  ...over,
});

describe("parseImportBody", () => {
  it("accepts a well formed body", () => {
    const parsed = parseImportBody(body());
    expect(parsed.accountId).toBe(1);
    expect(parsed.headers).toEqual(["date", "description", "amount"]);
    expect(parsed.records).toHaveLength(1);
  });

  it("rejects unknown fields and bad account ids", () => {
    expect(() => parseImportBody(body({ nope: 1 }))).toThrow(ValidationError);
    expect(() => parseImportBody(body({ accountId: 0 }))).toThrow(ValidationError);
    expect(() => parseImportBody(body({ accountId: "1" }))).toThrow(ValidationError);
    expect(() => parseImportBody(body({ csv: 42 }))).toThrow(ValidationError);
  });

  it("bounds column indices by the real header count", () => {
    expect(() => parseImportBody(body({ mapping: { ...MAPPING, dateColumn: 9 } }))).toThrow(ValidationError);
  });

  // The cap is a byte cap, not a character cap: a multi-byte description
  // would otherwise slip past a .length check.
  it("measures the size cap in bytes, not characters", () => {
    const multiByte = "€"; // 3 bytes, 1 character
    const justUnderInChars = "date,d,a\n" + multiByte.repeat(Math.ceil(MAX_IMPORT_BYTES / 3));
    expect(justUnderInChars.length).toBeLessThan(MAX_IMPORT_BYTES);
    expect(Buffer.byteLength(justUnderInChars, "utf8")).toBeGreaterThan(MAX_IMPORT_BYTES);
    expect(() => parseImportBody(body({ csv: justUnderInChars }))).toThrow(ImportTooLargeError);
  });

  it("rejects a file over the row cap", () => {
    const rows = ["date,description,amount"];
    for (let i = 0; i <= MAX_IMPORT_ROWS; i++) rows.push("2026-01-02,X,1.00");
    expect(() => parseImportBody(body({ csv: rows.join("\n") }))).toThrow(ImportTooLargeError);
  });
});

describe("importErrorResponse", () => {
  it("maps an oversize file to 413 and validation to 400", async () => {
    const tooLarge = importErrorResponse(new ImportTooLargeError("too big"))!;
    expect(tooLarge.status).toBe(413);
    expect(await tooLarge.json()).toEqual({ error: "too big" });

    const invalid = importErrorResponse(new ValidationError("nope"))!;
    expect(invalid.status).toBe(400);
  });

  it("passes an unexpected error through so it is not disguised as input error", () => {
    expect(importErrorResponse(new Error("boom"))).toBeNull();
  });
});
