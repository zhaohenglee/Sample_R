import { healthCheck } from "@/lib/health";

// Unauthenticated liveness/readiness probe for the compose healthcheck.
// Delegates to healthCheck (3 second budget by default), which never
// throws. The body never carries secrets or version info either way.
export async function GET() {
  const result = await healthCheck();
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
