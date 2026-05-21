import type { EmailConfig } from "@auth/core/providers/email";

import {
  MagicLinkEmail,
  buildMagicLinkSubject,
  buildMagicLinkText,
} from "@/emails/magic-link";
import { EMAIL_FROM, getResend } from "@/lib/resend";

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
    from: EMAIL_FROM,
    maxAge: 24 * 60 * 60,
    sendVerificationRequest: async ({ identifier, url, provider }) => {
      const resend = getResend();
      const from = provider.from ?? EMAIL_FROM;
      const { error } = await resend.emails.send({
        from,
        to: identifier,
        subject: buildMagicLinkSubject(),
        react: MagicLinkEmail({ url }),
        text: buildMagicLinkText(url),
      });
      if (error) {
        throw new Error(
          `Email to ${identifier} could not be sent: ${error.message}`,
        );
      }
    },
  };
}
