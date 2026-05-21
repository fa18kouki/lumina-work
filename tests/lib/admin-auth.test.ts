import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
  verifyAdminApiKey,
  verifyAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-32-chars-or-more-aaaaaa";

describe("ADMIN_SESSION_COOKIE", () => {
  it("uses an HttpOnly-friendly cookie name without dots", () => {
    expect(ADMIN_SESSION_COOKIE).toBe("admin-session");
  });
});

describe("verifyAdminApiKey", () => {
  it("returns true for exact match", () => {
    expect(verifyAdminApiKey("abc123", "abc123")).toBe(true);
  });

  it("returns false for any mismatch", () => {
    expect(verifyAdminApiKey("abc123", "abc124")).toBe(false);
    expect(verifyAdminApiKey("abc", "abc123")).toBe(false); // length differs
    expect(verifyAdminApiKey("abc1234", "abc123")).toBe(false);
  });

  it("returns false for empty input even if expected is empty (refuse trivial pass)", () => {
    expect(verifyAdminApiKey("", "")).toBe(false);
    expect(verifyAdminApiKey("", "anything")).toBe(false);
    expect(verifyAdminApiKey("anything", "")).toBe(false);
  });

  it("returns false for null / undefined input", () => {
    expect(verifyAdminApiKey(null, SECRET)).toBe(false);
    expect(verifyAdminApiKey(undefined, SECRET)).toBe(false);
  });
});

describe("createAdminSessionCookie + verifyAdminSessionCookie", () => {
  it("round-trips: a freshly created cookie verifies as ok", () => {
    const now = 1_700_000_000_000;
    const cookie = createAdminSessionCookie(SECRET, now);
    const result = verifyAdminSessionCookie(cookie, SECRET, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 24h ahead
      expect(result.exp).toBe(now + 24 * 60 * 60 * 1000);
    }
  });

  it("verifies as expired after 24h + 1ms", () => {
    const now = 1_700_000_000_000;
    const cookie = createAdminSessionCookie(SECRET, now);
    const later = now + 24 * 60 * 60 * 1000 + 1;
    const result = verifyAdminSessionCookie(cookie, SECRET, later);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("fails with bad_signature if the secret changes", () => {
    const now = 1_700_000_000_000;
    const cookie = createAdminSessionCookie(SECRET, now);
    const result = verifyAdminSessionCookie(cookie, "different-secret", now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_signature");
  });

  it("fails with bad_signature if the signature is tampered with", () => {
    const now = 1_700_000_000_000;
    const cookie = createAdminSessionCookie(SECRET, now);
    const [payload, sig] = cookie.split(".");
    // flip last char of signature
    const tampered = `${payload}.${sig.slice(0, -1)}${sig.slice(-1) === "a" ? "b" : "a"}`;
    const result = verifyAdminSessionCookie(tampered, SECRET, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_signature");
  });

  it("fails with malformed for missing or oddly-shaped cookies", () => {
    expect(verifyAdminSessionCookie(undefined, SECRET).ok).toBe(false);
    expect(verifyAdminSessionCookie(null, SECRET).ok).toBe(false);
    expect(verifyAdminSessionCookie("", SECRET).ok).toBe(false);
    expect(verifyAdminSessionCookie("no-dot", SECRET).ok).toBe(false);
    expect(verifyAdminSessionCookie("too.many.dots", SECRET).ok).toBe(false);
  });

  it("fails with malformed if payload is not parseable JSON", () => {
    // construct a cookie whose payload b64 decodes to garbage
    const badPayloadB64 = Buffer.from("not json at all", "utf-8").toString(
      "base64url",
    );
    const cookie = `${badPayloadB64}.deadbeef`;
    const result = verifyAdminSessionCookie(cookie, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(["malformed", "bad_signature"]).toContain(result.reason);
  });
});
