// In memory login rate limiter: 5 failures per IP within a 15 minute
// window. Not shared across processes -- fine for a single container
// single user app. `now` is injectable so tests do not need real sleeps.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_ENTRIES = 10_000;

type Entry = { failures: number[] };

const store = new Map<string, Entry>();

export type RateLimitStatus = { allowed: true } | { allowed: false; retryAfterSeconds: number };

function pruneExpired(entry: Entry, nowMs: number): void {
  const cutoff = nowMs - WINDOW_MS;
  while (entry.failures.length > 0 && entry.failures[0] <= cutoff) {
    entry.failures.shift();
  }
}

// Returns whether `ip` is currently allowed to attempt a login, based on
// failures recorded in the last 15 minutes. Read only: does not mutate or
// evict, so it is safe to call before deciding whether to check a password.
export function checkRateLimit(ip: string, now: () => number = Date.now): RateLimitStatus {
  const entry = store.get(ip);
  if (!entry) return { allowed: true };
  const nowMs = now();
  pruneExpired(entry, nowMs);
  if (entry.failures.length < MAX_FAILURES) return { allowed: true };
  const oldest = entry.failures[0];
  const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - nowMs) / 1000));
  return { allowed: false, retryAfterSeconds };
}

// Records a failed login attempt for `ip`.
export function recordFailure(ip: string, now: () => number = Date.now): void {
  const nowMs = now();
  let entry = store.get(ip);
  if (!entry) {
    evictOldestIfFull();
    entry = { failures: [] };
    store.set(ip, entry);
  }
  pruneExpired(entry, nowMs);
  entry.failures.push(nowMs);
}

// Clears any recorded failures for `ip` (call on successful login).
export function recordSuccess(ip: string): void {
  store.delete(ip);
}

// Caps the map at MAX_ENTRIES by evicting the oldest-inserted key still
// present. Map preserves insertion order, so the first key from the
// iterator is the oldest entry.
function evictOldestIfFull(): void {
  if (store.size < MAX_ENTRIES) return;
  const oldestKey = store.keys().next().value;
  if (oldestKey !== undefined) store.delete(oldestKey);
}

// Extracts the caller's IP: last hop of X-Forwarded-For, else X-Real-IP,
// else "unknown". The last hop is used (not the first) because our own
// reverse proxy (nginx/Caddy in front, or bare `next start` reading the
// socket address) appends the address it saw -- that is the one hop we
// can trust. Earlier hops are client-supplied and easily spoofed.
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

// Whether `req`'s body is an HTML form submission (as opposed to e.g. a
// JSON API call) based on Content-Type.
function isFormContentType(req: Request): boolean {
  const contentType = req.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

// Builds the response for a rate limited login attempt. Form posts (the
// browser's own login form) get a 303 redirect back to the login page
// with a friendly message instead of a raw JSON error; anything else
// (e.g. a JSON API client) gets 429 JSON. Both carry Retry-After.
export function rateLimitResponse(req: Request, retryAfterSeconds: number): Response {
  const retryAfterHeader = String(retryAfterSeconds);
  if (isFormContentType(req)) {
    const location = new URL(`/login?error=locked&retry=${retryAfterSeconds}`, req.url);
    return new Response(null, {
      status: 303,
      headers: { Location: location.toString(), "Retry-After": retryAfterHeader },
    });
  }
  return Response.json(
    { error: "too many attempts" },
    { status: 429, headers: { "Retry-After": retryAfterHeader } },
  );
}

// Test only: reset all recorded state between test cases.
export function _resetRateLimitForTests(): void {
  store.clear();
}

// Test only: current number of tracked IPs.
export function _rateLimitStoreSizeForTests(): number {
  return store.size;
}
