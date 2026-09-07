import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

const COOKIE = "fin_session";

function secret(): string {
  return process.env.TOKEN_ENCRYPTION_KEY ?? "dev";
}

export function sessionToken(): string {
  return createHmac("sha256", secret()).update("session:" + process.env.APP_PASSWORD).digest("hex");
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
