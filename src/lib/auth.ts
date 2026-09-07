import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { computeSessionToken, sha256Hex } from "./session-token";

const COOKIE = "fin_session";
const SESSION_SECRET_RE = /^[0-9a-f]{64}$/i;

// Fails fast (with a clear message) the first time a session token is
// needed, rather than silently falling back to a guessable secret.
function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || !SESSION_SECRET_RE.test(value)) {
    throw new Error(
      "SESSION_SECRET must be set to 32 bytes hex (64 hex chars). Generate one with: openssl rand -hex 32",
    );
  }
  return value;
}

// Stateless session token: HMAC(SESSION_SECRET, "session:v1:" + sha256(APP_PASSWORD)).
// Rotates automatically whenever APP_PASSWORD changes, and can be
// invalidated at any time by rotating SESSION_SECRET.
export function sessionToken(): string {
  const passwordHash = sha256Hex(process.env.APP_PASSWORD ?? "");
  return computeSessionToken(sessionSecret(), passwordHash);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return false;
  const a = Buffer.from(c);
  const b = Buffer.from(sessionToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAuthPage() {
  if (!(await isAuthed())) redirect("/login");
}

export async function requireAuthApi(): Promise<Response | null> {
  if (await isAuthed()) return null;
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function setSessionCookie() {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

export function checkSyncSecret(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const expected = process.env.SYNC_SECRET ?? "";
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
