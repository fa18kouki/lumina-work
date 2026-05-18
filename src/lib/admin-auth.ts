import crypto from "node:crypto";

/**
 * 管理画面用の API キー検証と、HMAC 署名付きセッション cookie の発行/検証。
 *
 * 設計メモ:
 *   - シングルテナントの内部ツール想定。共有 API キー 1 個 (.env: ADMIN_API_KEY) を
 *     ハッシュ後 timing-safe 比較する。
 *   - 認証成功時はサーバ署名つき cookie `admin-session` を 24h 発行する。
 *     cookie には API キー本体を入れない。ペイロードは `{exp:<ms>}` だけ。
 *     署名鍵には ADMIN_API_KEY をそのまま使う (鍵がローテーションされたら
 *     全セッションが自動失効する、という性質を意図的に持たせる)。
 *   - これらの関数は middleware/edge runtime からも呼ばれ得るので、
 *     node:crypto の使用は OK (Vercel Functions / Node.js runtime 上で動かす想定)。
 *     middleware は Node.js Fluid Compute (デフォルト) を前提とする。
 */

export const ADMIN_SESSION_COOKIE = "admin-session";

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * timing-safe な比較。長さ違い・空文字をはじいてから SHA-256 後の hash で比較する。
 *
 * timingSafeEqual は同長 Buffer を要求するため、両者を一旦 SHA-256 に通してから
 * 比較するパターンを採用 (長さでの分岐ですら情報を漏らさない)。
 * 空文字同士は誤って「一致」と判定しないよう先に false を返す。
 */
export function verifyAdminApiKey(
  input: string | null | undefined,
  expected: string,
): boolean {
  if (!input || !expected) return false;
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

interface AdminSessionPayload {
  exp: number;
}

function sign(payloadB64: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

export function createAdminSessionCookie(
  secret: string,
  now: number = Date.now(),
): string {
  const payload: AdminSessionPayload = { exp: now + SESSION_LIFETIME_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url",
  );
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export type AdminSessionVerification =
  | { ok: true; exp: number }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyAdminSessionCookie(
  cookie: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): AdminSessionVerification {
  if (!cookie || typeof cookie !== "string") {
    return { ok: false, reason: "malformed" };
  }
  const parts = cookie.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return { ok: false, reason: "malformed" };

  const expectedSig = sign(payloadB64, secret);
  // base64url 文字列同士の timing-safe 比較。長さが違う場合は明示的に false。
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: AdminSessionPayload;
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const parsed: unknown = JSON.parse(json);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as { exp?: unknown }).exp !== "number"
    ) {
      return { ok: false, reason: "malformed" };
    }
    payload = parsed as AdminSessionPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload.exp < now) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, exp: payload.exp };
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_LIFETIME_MS / 1000;
