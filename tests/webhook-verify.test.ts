import { describe, it, expect, vi } from "vitest";
import { createHash, generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { verifyPlaidWebhook, type JWK } from "@/lib/webhook-verify";

// This file exercises verifyPlaidWebhook in isolation (no DB, no network):
// deps.fetchKey is always stubbed, so tests/setup.ts's table truncation
// runs but nothing here reads or writes rows.

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function makeKeyPair(namedCurve = "P-256") {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve });
  return { publicKey, privateKey };
}

function jwkFromKeyPair(publicKey: ReturnType<typeof generateKeyPairSync>["publicKey"], kid: string): JWK {
  const jwk = publicKey.export({ format: "jwk" }) as { kty: string; crv: string; x: string; y: string };
  return { ...jwk, kid, alg: "ES256", use: "sig" };
}

function sign(privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"], data: Buffer): Buffer {
  return cryptoSign("sha256", data, { key: privateKey, dsaEncoding: "ieee-p1363" });
}

function buildJws(opts: {
  privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"];
  kid: string;
  body: string;
  alg?: string;
  iatSecondsAgo?: number;
  nowMsForIat?: number;
  headerOverride?: Record<string, unknown>;
  payloadOverride?: Record<string, unknown>;
}): string {
  const header = opts.headerOverride ?? { alg: opts.alg ?? "ES256", kid: opts.kid, typ: "JWT" };
  const baseMs = opts.nowMsForIat ?? Date.now();
  const iat = Math.floor(baseMs / 1000) - (opts.iatSecondsAgo ?? 0);
  const payload = opts.payloadOverride ?? {
    iat,
    request_body_sha256: createHash("sha256").update(opts.body, "utf8").digest("hex"),
  };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signature = sign(opts.privateKey, Buffer.from(`${headerPart}.${payloadPart}`, "utf8"));
  return `${headerPart}.${payloadPart}.${base64url(signature)}`;
}

describe("verifyPlaidWebhook", () => {
  const body = JSON.stringify({ webhook_type: "ITEM", webhook_code: "ERROR", item_id: "item1" });

  // The verifier keeps a module-level key cache keyed by kid, so each test
  // that primes the cache uses a fresh kid -- otherwise a later test's
  // fetchKey mock would never be consulted, it would just hit an earlier
  // test's cached (and possibly different) key.
  let kidCounter = 0;
  function freshKid(): string {
    kidCounter += 1;
    return `key-${kidCounter}`;
  }

  it("passes for a validly signed request", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body });
    const jwk = jwkFromKeyPair(publicKey, kid);
    const fetchKey = vi.fn(async () => jwk);

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: true });
  });

  it("fails when the body is tampered with after signing (sha mismatch)", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body + "tampered", jws, { fetchKey });
    expect(result.ok).toBe(false);
  });

  it("fails when the key does not match the signature", async () => {
    const { privateKey } = makeKeyPair();
    const wrongKeyPair = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(wrongKeyPair.publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result.ok).toBe(false);
  });

  it("fails for an unknown kid (fetchKey returns null)", async () => {
    const { privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body });
    const fetchKey = vi.fn(async () => null);

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "unknown kid" });
    expect(fetchKey).toHaveBeenCalledWith(kid);
  });

  it("fails when iat is more than 5 minutes old", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body, iatSecondsAgo: 6 * 60 });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result.ok).toBe(false);
  });

  it("fails when iat is more than 5 minutes in the future", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    // Negative iatSecondsAgo pushes iat into the future.
    const jws = buildJws({ privateKey, kid, body, iatSecondsAgo: -6 * 60 });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result.ok).toBe(false);
  });

  it("passes when iat is within 5 minutes, using an injected clock", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body, iatSecondsAgo: 4 * 60 });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey, now: () => Date.now() });
    expect(result).toEqual({ ok: true });
  });

  it("fails when the payload is missing request_body_sha256", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const iat = Math.floor(Date.now() / 1000);
    const jws = buildJws({ privateKey, kid, body, payloadOverride: { iat } });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "missing request_body_sha256" });
  });

  it("rejects alg none", async () => {
    const { privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body, headerOverride: { alg: "none", kid } });
    const fetchKey = vi.fn(async () => null);

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "unsupported alg" });
    expect(fetchKey).not.toHaveBeenCalled();
  });

  it("rejects HS256", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body, headerOverride: { alg: "HS256", kid } });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "unsupported alg" });
    expect(fetchKey).not.toHaveBeenCalled();
  });

  it("rejects a P-384 key even when the header claims ES256", async () => {
    const { publicKey, privateKey } = makeKeyPair("P-384");
    const kid = freshKid();
    const jws = buildJws({ privateKey, kid, body });
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "unsupported key type" });
  });

  it("rejects an RSA key even when the header claims ES256", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const kid = freshKid();
    const header = { alg: "ES256", kid, typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const payload = { iat, request_body_sha256: createHash("sha256").update(body, "utf8").digest("hex") };
    const headerPart = base64url(JSON.stringify(header));
    const payloadPart = base64url(JSON.stringify(payload));
    // RS256 signature over the same signing input -- irrelevant, since the
    // key-type check must reject this key before any signature is checked.
    const signature = cryptoSign("RSA-SHA256", Buffer.from(`${headerPart}.${payloadPart}`, "utf8"), privateKey);
    const jws = `${headerPart}.${payloadPart}.${base64url(signature)}`;

    const rsaJwk = publicKey.export({ format: "jwk" }) as unknown as { kty: string; n: string; e: string };
    const fetchKey = vi.fn(async () => ({ ...rsaJwk, kid, alg: "RS256", use: "sig" } as unknown as JWK));

    const result = await verifyPlaidWebhook(body, jws, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "unsupported key type" });
  });

  it("rejects a malformed header without throwing", async () => {
    const fetchKey = vi.fn(async () => null);
    const result = await verifyPlaidWebhook(body, "not-a-jwt", { fetchKey });
    expect(result.ok).toBe(false);
  });

  it("rejects garbage tokens without throwing", async () => {
    const fetchKey = vi.fn(async () => null);
    const garbageTokens = [
      "",
      ".",
      "..",
      "a.b.c",
      `${base64url("{not json")}.${base64url("{}")}.${base64url("sig")}`,
      `${base64url(JSON.stringify({ alg: "ES256", kid: "k" }))}.notbase64url!!!.sig`,
    ];
    for (const token of garbageTokens) {
      await expect(verifyPlaidWebhook(body, token, { fetchKey })).resolves.toMatchObject({ ok: false });
    }
  });

  it("rejects a null header (missing Plaid-Verification)", async () => {
    const fetchKey = vi.fn(async () => null);
    const result = await verifyPlaidWebhook(body, null, { fetchKey });
    expect(result).toEqual({ ok: false, reason: "missing Plaid-Verification header" });
    expect(fetchKey).not.toHaveBeenCalled();
  });

  it("caches the key by kid: fetchKey is called once for two verifications", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const jws1 = buildJws({ privateKey, kid, body });
    const result1 = await verifyPlaidWebhook(body, jws1, { fetchKey });
    expect(result1).toEqual({ ok: true });

    const body2 = JSON.stringify({ webhook_type: "ITEM", webhook_code: "PENDING_EXPIRATION", item_id: "item1" });
    const jws2 = buildJws({ privateKey, kid, body: body2 });
    const result2 = await verifyPlaidWebhook(body2, jws2, { fetchKey });
    expect(result2).toEqual({ ok: true });

    expect(fetchKey).toHaveBeenCalledTimes(1);
  });

  it("a second kid triggers a second fetch", async () => {
    const { publicKey: pub1, privateKey: priv1 } = makeKeyPair();
    const { publicKey: pub2, privateKey: priv2 } = makeKeyPair();
    const kid1 = freshKid();
    const kid2 = freshKid();
    const fetchKey = vi.fn(async (k: string) => (k === kid1 ? jwkFromKeyPair(pub1, kid1) : jwkFromKeyPair(pub2, kid2)));

    const jws1 = buildJws({ privateKey: priv1, kid: kid1, body });
    const result1 = await verifyPlaidWebhook(body, jws1, { fetchKey });
    expect(result1).toEqual({ ok: true });

    const jws2 = buildJws({ privateKey: priv2, kid: kid2, body });
    const result2 = await verifyPlaidWebhook(body, jws2, { fetchKey });
    expect(result2).toEqual({ ok: true });

    expect(fetchKey).toHaveBeenCalledTimes(2);
  });

  it("a cached key entry expires after 24 hours, using an injected clock", async () => {
    const { publicKey, privateKey } = makeKeyPair();
    const kid = freshKid();
    const fetchKey = vi.fn(async () => jwkFromKeyPair(publicKey, kid));

    const t0 = Date.now();
    let currentTime = t0;
    const now = () => currentTime;

    const jws1 = buildJws({ privateKey, kid, body, nowMsForIat: currentTime });
    const result1 = await verifyPlaidWebhook(body, jws1, { fetchKey, now });
    expect(result1).toEqual({ ok: true });
    expect(fetchKey).toHaveBeenCalledTimes(1);

    // +23h: still within the 24h TTL -- cache hit, no refetch.
    currentTime = t0 + 23 * 60 * 60 * 1000;
    const jws2 = buildJws({ privateKey, kid, body, nowMsForIat: currentTime });
    const result2 = await verifyPlaidWebhook(body, jws2, { fetchKey, now });
    expect(result2).toEqual({ ok: true });
    expect(fetchKey).toHaveBeenCalledTimes(1);

    // +25h: past the 24h TTL -- refetches.
    currentTime = t0 + 25 * 60 * 60 * 1000;
    const jws3 = buildJws({ privateKey, kid, body, nowMsForIat: currentTime });
    const result3 = await verifyPlaidWebhook(body, jws3, { fetchKey, now });
    expect(result3).toEqual({ ok: true });
    expect(fetchKey).toHaveBeenCalledTimes(2);
  });

  it("negative-caches an unknown kid for 5 minutes, but a later valid kid still fetches", async () => {
    const { privateKey } = makeKeyPair();
    const kid = freshKid();
    const fetchKey = vi.fn(async () => null);

    const jws1 = buildJws({ privateKey, kid, body });
    const result1 = await verifyPlaidWebhook(body, jws1, { fetchKey });
    expect(result1).toEqual({ ok: false, reason: "unknown kid" });

    const jws2 = buildJws({ privateKey, kid, body });
    const result2 = await verifyPlaidWebhook(body, jws2, { fetchKey });
    expect(result2).toEqual({ ok: false, reason: "unknown kid" });

    expect(fetchKey).toHaveBeenCalledTimes(1);

    // A different, valid kid is unaffected by the first kid's negative cache.
    const { publicKey: pub2, privateKey: priv2 } = makeKeyPair();
    const kid2 = freshKid();
    const fetchKey2 = vi.fn(async () => jwkFromKeyPair(pub2, kid2));
    const jws3 = buildJws({ privateKey: priv2, kid: kid2, body });
    const result3 = await verifyPlaidWebhook(body, jws3, { fetchKey: fetchKey2 });
    expect(result3).toEqual({ ok: true });
    expect(fetchKey2).toHaveBeenCalledTimes(1);
  });

  it("negative-caches a throwing fetchKey the same as a null result", async () => {
    const { privateKey } = makeKeyPair();
    const kid = freshKid();
    const fetchKey = vi.fn(async () => {
      throw new Error("network error");
    });

    const jws1 = buildJws({ privateKey, kid, body });
    const result1 = await verifyPlaidWebhook(body, jws1, { fetchKey });
    expect(result1.ok).toBe(false);

    const jws2 = buildJws({ privateKey, kid, body });
    const result2 = await verifyPlaidWebhook(body, jws2, { fetchKey });
    expect(result2.ok).toBe(false);

    expect(fetchKey).toHaveBeenCalledTimes(1);
  });
});
