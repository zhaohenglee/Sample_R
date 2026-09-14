import { createHash, createPublicKey, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import { plaid } from "./plaid";

// A JSON Web Key as returned by Plaid's /webhook_verification_key/get and
// accepted by node:crypto's createPublicKey({ format: "jwk" }).
export type JWK = {
  kty: string;
  crv: string;
  x: string;
  y: string;
  kid: string;
  alg?: string;
  use?: string;
};

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export type VerifyDeps = {
  fetchKey?: (kid: string) => Promise<JWK | null>;
  now?: () => number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;
const IAT_TOLERANCE_MS = 5 * 60 * 1000;

// `key: null` is a negative cache entry -- an unknown kid or a failed fetch,
// remembered briefly so a flood of requests for a bad kid doesn't hammer
// Plaid on every single one.
type CacheEntry = { key: JWK | null; fetchedAt: number };

// Module level cache shared across requests within this process. Keyed by
// `kid` so a rolled-over signing key does not require a redeploy.
const keyCache = new Map<string, CacheEntry>();

async function defaultFetchKey(kid: string): Promise<JWK | null> {
  const res = await plaid.webhookVerificationKeyGet({ key_id: kid });
  return (res.data.key as unknown as JWK) ?? null;
}

async function getKey(kid: string, fetchKey: (kid: string) => Promise<JWK | null>, now: number): Promise<JWK | null> {
  const cached = keyCache.get(kid);
  if (cached) {
    const ttl = cached.key === null ? NEGATIVE_CACHE_TTL_MS : CACHE_TTL_MS;
    if (now - cached.fetchedAt < ttl) return cached.key;
  }

  // A throwing fetchKey is treated the same as a null result: negative
  // cached below so a persistently failing kid does not retry every call.
  let key: JWK | null;
  try {
    key = await fetchKey(kid);
  } catch {
    key = null;
  }

  // Evict the oldest entry before inserting when at capacity, so the cache
  // never grows past CACHE_MAX_ENTRIES even under a kid-rotation storm.
  if (!keyCache.has(kid) && keyCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKid = keyCache.keys().next().value;
    if (oldestKid !== undefined) keyCache.delete(oldestKid);
  }
  keyCache.set(kid, { key, fetchedAt: now });
  return key;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function decodeJwsHeader(jwtHeader: string): { header: unknown; headerPart: string; payloadPart: string; sigPart: string } | null {
  const parts = jwtHeader.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, sigPart] = parts;
  if (!headerPart || !payloadPart || !sigPart) return null;
  try {
    const header = JSON.parse(base64UrlDecode(headerPart).toString("utf8"));
    return { header, headerPart, payloadPart, sigPart };
  } catch {
    return null;
  }
}

// Only ES256 over the P-256 curve is acceptable: a JWK claiming any other
// key type/curve (or an alg/use that contradicts ES256 signing) is rejected
// before it ever reaches createPublicKey, regardless of what the outer JWT
// header claimed.
function isAcceptableSigningKey(jwk: JWK): boolean {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256") return false;
  if (jwk.alg !== undefined && jwk.alg !== "ES256") return false;
  if (jwk.use !== undefined && jwk.use !== "sig") return false;
  return true;
}

export async function verifyPlaidWebhook(
  rawBody: string,
  jwtHeader: string | null,
  deps?: VerifyDeps,
): Promise<VerifyResult> {
  const fetchKey = deps?.fetchKey ?? defaultFetchKey;
  const now = deps?.now ?? (() => Date.now());

  if (!jwtHeader) return { ok: false, reason: "missing Plaid-Verification header" };

  const decoded = decodeJwsHeader(jwtHeader);
  if (!decoded) return { ok: false, reason: "malformed JWT" };
  const { header, headerPart, payloadPart, sigPart } = decoded;

  if (
    typeof header !== "object" ||
    header === null ||
    (header as { alg?: unknown }).alg !== "ES256"
  ) {
    return { ok: false, reason: "unsupported alg" };
  }
  const kid = (header as { kid?: unknown }).kid;
  if (typeof kid !== "string" || kid.length === 0) return { ok: false, reason: "missing kid" };

  let jwk: JWK | null;
  try {
    jwk = await getKey(kid, fetchKey, now());
  } catch {
    return { ok: false, reason: "key fetch failed" };
  }
  if (!jwk) return { ok: false, reason: "unknown kid" };
  if (!isAcceptableSigningKey(jwk)) return { ok: false, reason: "unsupported key type" };

  let publicKey;
  try {
    publicKey = createPublicKey({ key: jwk as unknown as Record<string, unknown>, format: "jwk" });
  } catch {
    return { ok: false, reason: "invalid key" };
  }

  let sigValid = false;
  try {
    const data = Buffer.from(`${headerPart}.${payloadPart}`, "utf8");
    const sig = base64UrlDecode(sigPart);
    sigValid = cryptoVerify("sha256", data, { key: publicKey, dsaEncoding: "ieee-p1363" }, sig);
  } catch {
    return { ok: false, reason: "signature verification error" };
  }
  if (!sigValid) return { ok: false, reason: "invalid signature" };

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed payload" };
  }
  if (typeof payload !== "object" || payload === null) return { ok: false, reason: "malformed payload" };

  const iat = (payload as { iat?: unknown }).iat;
  if (typeof iat !== "number" || !Number.isFinite(iat)) return { ok: false, reason: "missing iat" };
  if (Math.abs(now() - iat * 1000) > IAT_TOLERANCE_MS) return { ok: false, reason: "iat too old" };

  const expectedHash = (payload as { request_body_sha256?: unknown }).request_body_sha256;
  if (typeof expectedHash !== "string") return { ok: false, reason: "missing request_body_sha256" };

  const actualHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expectedHash, "utf8");
  const actualBuf = Buffer.from(actualHash, "utf8");
  const hashMatches =
    expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
  if (!hashMatches) return { ok: false, reason: "body hash mismatch" };

  return { ok: true };
}
