// Shared helpers for interpreting Postgres errors surfaced through the
// `postgres` driver, which Drizzle wraps in a DrizzleQueryError with the
// original PostgresError (code, constraint_name, ...) as `.cause`.
export function pgErrorCode(e: unknown): string | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const withCause = e as { cause?: unknown; code?: unknown };
  const candidate = withCause.code !== undefined ? withCause : (withCause.cause as { code?: unknown } | undefined);
  if (candidate && typeof candidate === "object" && "code" in candidate) {
    const code = (candidate as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

// Postgres class 22 "data exception" codes we might hit from a value that
// slipped past our own validation but that Postgres itself rejects (e.g. a
// numeric literal out of range, or malformed input for a type). Route
// handlers map these to 400 instead of letting them bubble up as a 500.
const DATA_EXCEPTION_CODES = new Set([
  "22003", // numeric_value_out_of_range
  "22P02", // invalid_text_representation
  "22001", // string_data_right_truncation
]);

export function isPgDataError(e: unknown): boolean {
  const code = pgErrorCode(e);
  return !!code && DATA_EXCEPTION_CODES.has(code);
}
