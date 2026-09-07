import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSessionCookie();
  return Response.redirect(new URL("/login", req.url), 303);
}
