import { describe, it, expect, beforeEach } from "vitest";
import { checkPassword } from "@/lib/auth";
import { computeSessionToken, sha256Hex } from "@/lib/session-token";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  recordFailure,
  recordSuccess,
  _resetRateLimitForTests,
  _rateLimitStoreSizeForTests,
} from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    _resetRateLimitForTests();
  });

  it("allows up to 5 failures within the window", () => {
    const ip = "1.1.1.1";
    let now = 0;
    const clock = () => now;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip, clock).allowed).toBe(true);
      recordFailure(ip, clock);
      now += 1000;
    }
    // Five failures recorded; still not yet at the block threshold check
    // for a 6th attempt until we ask again.
    expect(checkRateLimit(ip, clock).allowed).toBe(false);
  });

  it("blocks the 6th attempt within the window with retry seconds", () => {
    const ip = "2.2.2.2";
    let now = 0;
    const clock = () => now;
    for (let i = 0; i < 5; i++) {
      recordFailure(ip, clock);
      now += 1000; // 5 failures spread 1s apart, oldest at t=0
    }
    // now = 5000ms. Oldest failure at t=0 expires at t=15*60*1000.
    const status = checkRateLimit(ip, clock);
    expect(status.allowed).toBe(false);
    if (!status.allowed) {
      const expected = Math.ceil((0 + 15 * 60 * 1000 - now) / 1000);
      expect(status.retryAfterSeconds).toBe(expected);
      expect(status.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("unblocks once the oldest failure leaves the 15 minute window", () => {
    const ip = "3.3.3.3";
    let now = 0;
    const clock = () => now;
    for (let i = 0; i < 5; i++) {
      recordFailure(ip, clock);
    }
    expect(checkRateLimit(ip, clock).allowed).toBe(false);
    now = 15 * 60 * 1000 + 1; // one ms past the window for all 5 failures
    expect(checkRateLimit(ip, clock).allowed).toBe(true);
  });

  it("clears the entry on success", () => {
    const ip = "4.4.4.4";
    let now = 0;
    const clock = () => now;
    for (let i = 0; i < 5; i++) recordFailure(ip, clock);
    expect(checkRateLimit(ip, clock).allowed).toBe(false);
    recordSuccess(ip);
    expect(checkRateLimit(ip, clock).allowed).toBe(true);
  });

  it("tracks failures per IP independently", () => {
    const clock = () => 0;
    for (let i = 0; i < 5; i++) recordFailure("5.5.5.5", clock);
    expect(checkRateLimit("5.5.5.5", clock).allowed).toBe(false);
    expect(checkRateLimit("6.6.6.6", clock).allowed).toBe(true);
  });

  it("caps the store at 10000 entries by evicting the oldest", () => {
    const clock = () => 0;
    for (let i = 0; i < 10_000; i++) {
      recordFailure(`ip-${i}`, clock);
    }
    expect(_rateLimitStoreSizeForTests()).toBe(10_000);
    // One more distinct IP should evict the oldest (ip-0) to stay at cap.
    recordFailure("ip-10000", clock);
    expect(_rateLimitStoreSizeForTests()).toBe(10_000);
    // The evicted IP's history is gone, so it is allowed again immediately.
    expect(checkRateLimit("ip-0", clock).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses the LAST hop of X-Forwarded-For, not the first", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    // The last hop is the one our own reverse proxy appended; earlier
    // hops are client-supplied and easily spoofed.
    expect(getClientIp(req)).toBe("2.2.2.2");
  });

  it("trims whitespace around each hop", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "1.1.1.1 ,  2.2.2.2  ,3.3.3.3" },
    });
    expect(getClientIp(req)).toBe("3.3.3.3");
  });

  it("returns the single value when X-Forwarded-For has one hop", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is absent", () => {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "4.4.4.4" },
    });
    expect(getClientIp(req)).toBe("4.4.4.4");
  });

  it('falls back to "unknown" when neither header is present', () => {
    const req = new Request("http://localhost/api/auth/login");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimitResponse", () => {
  it("redirects a urlencoded form post to /login?error=locked&retry=<seconds>", () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const res = rateLimitResponse(req, 42);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=locked&retry=42");
    expect(res.headers.get("retry-after")).toBe("42");
  });

  it("redirects a multipart form post the same way", () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=----abc" },
    });
    const res = rateLimitResponse(req, 900);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=locked&retry=900");
  });

  it("returns 429 JSON with Retry-After for non form content types", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    const res = rateLimitResponse(req, 15);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("15");
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 429 JSON when there is no Content-Type at all", () => {
    const req = new Request("http://localhost/api/auth/login", { method: "POST" });
    const res = rateLimitResponse(req, 5);
    expect(res.status).toBe(429);
  });
});

describe("computeSessionToken", () => {
  it("is deterministic for the same inputs", () => {
    const a = computeSessionToken("secretA", "hashA");
    const b = computeSessionToken("secretA", "hashA");
    expect(a).toBe(b);
  });

  it("changes when the password (hash) changes", () => {
    const a = computeSessionToken("secretA", sha256Hex("password1"));
    const b = computeSessionToken("secretA", sha256Hex("password2"));
    expect(a).not.toBe(b);
  });

  it("changes when the secret changes", () => {
    const a = computeSessionToken("secretA", "hashA");
    const b = computeSessionToken("secretB", "hashA");
    expect(a).not.toBe(b);
  });
});

describe("checkPassword", () => {
  it("accepts the configured APP_PASSWORD", () => {
    expect(checkPassword(process.env.APP_PASSWORD ?? "")).toBe(true);
  });

  it("rejects a wrong password of a different length", () => {
    expect(checkPassword("x")).toBe(false);
    expect(checkPassword("way-too-long-and-definitely-wrong-password")).toBe(false);
  });

  it("rejects a wrong password of the same length", () => {
    const expected = process.env.APP_PASSWORD ?? "";
    const sameLengthWrong = expected.slice(0, -1) + (expected.at(-1) === "x" ? "y" : "x");
    expect(checkPassword(sameLengthWrong)).toBe(false);
  });
});
