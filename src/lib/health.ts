import { sql } from "drizzle-orm";
import { db } from "@/db";

// Races `promise` against a timer that rejects after `ms` milliseconds.
// Used to bound how long a health check can block on the database.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export type HealthResult = { ok: boolean; db: boolean };

const DEFAULT_TIMEOUT_MS = 3000;

// Runs `select 1` against the database with a bounded timeout and never
// throws: a timeout, a connection error, or anything else all come back
// as { ok: false, db: false }. `deps.timeoutMs` overrides the 3 second
// production default -- tests use a few milliseconds so a never-resolving
// query fails fast instead of hanging the suite.
export async function healthCheck(deps?: { timeoutMs?: number }): Promise<HealthResult> {
  const timeoutMs = deps?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  try {
    await withTimeout(db.execute(sql`select 1`), timeoutMs);
    return { ok: true, db: true };
  } catch {
    return { ok: false, db: false };
  }
}
