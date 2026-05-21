import { Resend } from "resend";

/**
 * Resend クライアントのシングルトン。
 *
 * 使い方:
 *   import { getResend, getEmailFrom } from "@/lib/resend";
 *   await getResend().emails.send({ from: getEmailFrom(), to, subject, react: <Template /> });
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

/**
 * メール送信元アドレス。Resend で検証済みのドメイン由来である必要がある。
 *
 * 旧実装では `process.env.EMAIL_FROM ?? "LUMINA <noreply@lumina-work.jp>"`
 * の fallback を持っていたが、これは「環境変数の設定漏れに気付かないまま
 * 本番ドメイン風の送信元でメールを送ってしまう」事故を招く。Resend 側で
 * ドメイン未検証なら配送失敗するとはいえ、検証済みドメイン x EMAIL_FROM
 * 未設定 の組み合わせでは "事故 send" が成立してしまう。
 *
 * よって env 必須化し、未設定なら send タイミングで明示的に throw する。
 */
export function getEmailFrom(): string {
  const v = process.env.EMAIL_FROM;
  if (!v) {
    throw new Error(
      "EMAIL_FROM is not configured. Set it to e.g. 'LUMINA <noreply@yourdomain>'",
    );
  }
  return v;
}

/** リトライ・冪等性のために使う prefix (idempotencyKey の名前空間) */
export const IDEMPOTENCY_NAMESPACE = "lumina";
