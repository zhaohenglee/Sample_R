export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      {error && <p className="mb-3 text-sm text-red-600">Wrong password.</p>}
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
