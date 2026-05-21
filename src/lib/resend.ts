import { Resend } from "resend";

/**
 * Resend クライアントのシングルトン。
 *
 * 使い方:
 *   import { resend, EMAIL_FROM } from "@/lib/resend";
 *   await resend.emails.send({ from: EMAIL_FROM, to, subject, react: <Template /> });
 *
 * 設計メモ:
 *   - API キーは `RESEND_API_KEY`。Vercel env で環境別に分ける。
 *   - 開発・テスト時に未設定でも import 自体は壊さない (実送信時に Resend SDK 側で 401)。
 *   - send 失敗時の retry / idempotency は呼び出し側で。
 */

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  cached = new Resend(apiKey);
  return cached;
}

/** テスト目的のみ。本番コードから呼ばない。 */
export function _resetResendCache() {
  cached = null;
}

/** メール送信元アドレス。Resend で検証済みのドメイン由来である必要がある。 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "LUMINA <noreply@lumina-work.jp>";

/** リトライ・冪等性のために使う prefix (idempotencyKey の名前空間) */
export const IDEMPOTENCY_NAMESPACE = "lumina";
