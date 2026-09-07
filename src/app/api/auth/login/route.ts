import { checkPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    return Response.redirect(new URL("/login?error=1", req.url), 303);
  }
  await setSessionCookie();
  return Response.redirect(new URL("/", req.url), 303);
}

export async function DELETE() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
