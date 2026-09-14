import { createHash, createHmac } from "node:crypto";

// Pure helpers shared by src/lib/auth.ts (Node runtime) and src/proxy.ts
// (also Node runtime in Next 16 by default -- verified by `npm run build`).
// Keeping these free of any framework import means both call sites compute
// the exact same session token from the same two inputs.

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

// value = HMAC-SHA256(secret, "session:v1:" + sha256(password)).
// Rotates automatically when APP_PASSWORD changes (the password hash feeds
// the HMAC message) and can be invalidated at any time by rotating
// SESSION_SECRET.
export function computeSessionToken(secret: string, passwordHash: string): string {
  return createHmac("sha256", secret).update("session:v1:" + passwordHash).digest("hex");
}
