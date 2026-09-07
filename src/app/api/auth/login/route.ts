import { checkPassword, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse, recordFailure, recordSuccess } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return rateLimitResponse(req, limit.retryAfterSeconds);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.redirect(new URL("/login?error=1", req.url), 303);
  }

  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    recordFailure(ip);
    return Response.redirect(new URL("/login?error=1", req.url), 303);
  }

  recordSuccess(ip);
  await setSessionCookie();
  return Response.redirect(new URL("/", req.url), 303);
}
