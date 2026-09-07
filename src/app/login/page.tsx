// N (minutes) falls back to 15 whenever `retry` (seconds) is missing or
// not a positive integer -- keeps the message sane if the query string is
// tampered with or truncated.
function lockedMinutes(retry: string | undefined): number {
  const seconds = Number(retry);
  if (!Number.isInteger(seconds) || seconds <= 0) return 15;
  return Math.ceil(seconds / 60);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>;
}) {
  const { error, retry } = await searchParams;
  const locked = error === "locked";
  const minutes = locked ? lockedMinutes(retry) : null;

  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      {locked ? (
        <p className="mb-3 text-sm text-red-600">
          Too many attempts. Try again in {minutes} minute{minutes === 1 ? "" : "s"}.
        </p>
      ) : (
        error && <p className="mb-3 text-sm text-red-600">Wrong password.</p>
      )}
      <form method="post" action="/api/auth/login" className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded border px-3 py-2"
        />
        <button className="w-full rounded bg-gray-900 px-3 py-2 text-white">Continue</button>
      </form>
    </div>
  );
}
