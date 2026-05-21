import type { EmailConfig } from "@auth/core/providers/email";

import {
  MagicLinkEmail,
  buildMagicLinkSubject,
  buildMagicLinkText,
} from "@/emails/magic-link";
import { getEmailFrom, getResend } from "@/lib/resend";

/**
 * email アドレスを部分マスクして PII を伏せる。
 *   - "alice@example.com" → "a***@example.com"
 *   - "ab@example.com"    → "a***@example.com"
 *   - "@example.com"      → "@example.com" (local part 空はそのまま)
 *   - 不正形式 / @ 無し   → "***" (全消し)
 *
 * 障害切り分け用に「ドメインだけは残す」方針 (Resend 側のドメイン由来エラーが
 * domain 特定で済むケースが多いため)。
 */
function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length === 0) return domain;
  return `${local[0]}***${domain}`;
}

/**
 * NextAuth v5 用の Email provider (Resend SDK で送信)。
 *
 * 設計メモ:
 *   - 旧 `next-auth/providers/nodemailer` を完全に置き換える
 *   - `id: "nodemailer"` を維持して既存の `signIn("nodemailer", ...)` 呼び出しを壊さない
 *   - 24h 有効 (maxAge デフォルト)
 *   - 本テンプレートは React Email (`MagicLinkEmail`) を使い、Resend SDK が
 *     内部で render → 配送する
 */
export function ResendEmailProvider(): EmailConfig {
  return {
    id: "nodemailer",
    type: "email",
    name: "Email",
    // NextAuth の型は from: string を要求するので空文字を充てる (placeholder)。
    // 実際の送信元は sendVerificationRequest で getEmailFrom() を呼び、
    // env 未設定なら明示的に throw する。factory 呼び出し時 (= module load 時)
    // に throw すると、テストや EMAIL_FROM を直接使わない経路の import まで
    // 連鎖失敗する。「実送信が走る瞬間にだけ厳格にチェックする」方針にする。
    from: "",
    maxAge: 24 * 60 * 60,
    sendVerificationRequest: async ({ identifier, url, provider }) => {
      const resend = getResend();
      // provider.from に explicit な override が入っていない (空文字 含む) 場合は env から解決。
      const from = provider.from && provider.from.length > 0
        ? provider.from
        : getEmailFrom();
      const { error } = await resend.emails.send({
        from,
        to: identifier,
        subject: buildMagicLinkSubject(),
        react: MagicLinkEmail({ url }),
        text: buildMagicLinkText(url),
      });
      if (error) {
        // PII (送信先 email) を例外メッセージに乗せると Sentry / ログ集約系に
        // 平文で流れるため、masked 表現に置換して残す。
        // 例: "alice@example.com" → "a***@example.com"
        // identifier 自体は呼び出し元 (NextAuth core) と上流のリクエストで握っているので
        // 障害切り分けに困らない。
        throw new Error(
          `Email to ${maskEmail(identifier)} could not be sent: ${error.message}`,
        );
      }
    },
  };
}
