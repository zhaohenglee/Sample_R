import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { computeSessionToken, sha256Hex } from "@/lib/session-token";

// Redirects unauthenticated page requests to /login so individual pages
// do not each need to call requireAuthPage() (kept anyway as defense in
// depth -- see src/lib/auth.ts). /login, /api/*, /_next/*, and
// /favicon.ico are excluded via the matcher below: API routes keep
// returning 401 JSON from requireAuthApi(), and the login page itself
// must stay reachable while logged out.
//
// Next 16 proxy files run in the Node.js runtime by default (verified by
// `npm run build`), so node:crypto is available here directly -- this
// computes the session token the same way src/lib/auth.ts does, via the
// shared pure helper in src/lib/session-token.ts.

const COOKIE = "fin_session";
const SESSION_SECRET_RE = /^[0-9a-f]{64}$/i;

function expectedSessionToken(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !SESSION_SECRET_RE.test(secret)) return null;
  const passwordHash = sha256Hex(process.env.APP_PASSWORD ?? "");
  return computeSessionToken(secret, passwordHash);
}

function isAuthed(request: NextRequest): boolean {
  const expected = expectedSessionToken();
  if (!expected) return false;
  const cookie = request.cookies.get(COOKIE)?.value;
  if (!cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function proxy(request: NextRequest) {
  if (isAuthed(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

// Each exclusion is anchored with a trailing `$` inside the lookahead so
// only the exact segment or its sub-paths are excluded -- e.g. "login"
// and "login/whatever" are excluded, but "loginfoo" and "api-docs" are
// NOT (a plain `(?!login|api)` prefix match would wrongly swallow those
// and skip auth on them).
export const config = {
  matcher: [
    "/((?!(?:login(?:/.*)?|api(?:/.*)?|_next(?:/.*)?|favicon\\.ico)$).*)",
  ],
};
