import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { withTimeout, healthCheck } from "@/lib/health";

describe("health", () => {
  it("returns 200 with { ok: true, db: true } against the real test DB", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, db: true });
  });

  it("never throws even if something goes wrong internally", async () => {
    await expect(GET()).resolves.toBeInstanceOf(Response);
  });
});

describe("withTimeout", () => {
  it("resolves with the underlying value when it settles before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("done"), 50)).resolves.toBe("done");
  });

  it("rejects after ms when the promise never settles", async () => {
    const never = new Promise(() => {});
    await expect(withTimeout(never, 20)).rejects.toThrow(/timed out/);
  });

  it("propagates a rejection that happens before the deadline", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 50)).rejects.toThrow("boom");
  });
});

describe("healthCheck against a mocked db", () => {
  // Each test here mocks "@/db" and re-imports src/lib/health.ts and the
  // route fresh, so the mock only affects this describe block -- the real
  // DB tests above use the statically imported, real-db-backed bindings.
  afterEach(() => {
    vi.doUnmock("@/db");
    vi.resetModules();
  });

  it("returns { ok: false, db: false } and the route answers 503 when db.execute rejects", async () => {
    vi.resetModules();
    vi.doMock("@/db", () => ({
      db: { execute: vi.fn().mockRejectedValue(new Error("connection refused")) },
      schema: {},
    }));

    const { healthCheck: mockedHealthCheck } = await import("@/lib/health");
    await expect(mockedHealthCheck()).resolves.toEqual({ ok: false, db: false });

    const { GET: mockedGET } = await import("@/app/api/health/route");
    const res = await mockedGET();
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, db: false });
  });

  // Uses an injectable timeout (a few ms, not the real 3s default) so a
  // db.execute call that never resolves still fails fast. If the withTimeout
  // race were ever removed from healthCheck, this promise would never
  // settle and this test would fail on its own timeout below.
  it(
    "times out instead of hanging when db.execute never resolves",
    async () => {
      vi.resetModules();
      vi.doMock("@/db", () => ({
        db: { execute: vi.fn().mockReturnValue(new Promise(() => {})) },
        schema: {},
      }));

      const { healthCheck: mockedHealthCheck } = await import("@/lib/health");
      const started = Date.now();
      const result = await mockedHealthCheck({ timeoutMs: 20 });
      expect(Date.now() - started).toBeLessThan(500);
      expect(result).toEqual({ ok: false, db: false });
    },
    1000,
  );
});
