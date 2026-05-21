import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

const SERVICE_NAME = "LUMINA";

interface OwnerPasswordResetEmailProps {
  url: string;
}

/**
 * Owner のパスワードリセット依頼メール。
 * 送信主体は `src/server/auth/owner-email.ts` の `sendOwnerPasswordResetEmail` (Resend SDK)。
 */
export function OwnerPasswordResetEmail({ url }: OwnerPasswordResetEmailProps) {
  return (
    <NotificationLayout
      heading={`${SERVICE_NAME} パスワードの再設定`}
      ctaUrl={url}
      ctaLabel="パスワードを再設定する"
      preview={`${SERVICE_NAME} パスワードの再設定リンクが届いています`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {SERVICE_NAME}{" "}
        オーナーアカウントのパスワード再設定の依頼を受け付けました。下のボタンから新しいパスワードを設定してください。
      </Text>
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        このリンクは 1
        時間のみ有効です。お心当たりがない場合や、ご自身で再設定を依頼していない場合は、このメールは破棄してください。アカウントは安全です。
      </Text>
      <Section style={{ marginTop: "24px" }}>
        <Text style={{ color: "#999", fontSize: "12px", lineHeight: 1.6 }}>
          ボタンが動作しない場合は、次の URL をブラウザに直接貼り付けてください:
        </Text>
        <Text
          style={{ color: "#999", fontSize: "12px", wordBreak: "break-all" }}
        >
          {url}
        </Text>
      </Section>
    </NotificationLayout>
  );
}

export function buildOwnerPasswordResetSubject(): string {
  return `${SERVICE_NAME} パスワード再設定のお知らせ`;
}

export function buildOwnerPasswordResetText(url: string): string {
  return `${SERVICE_NAME} パスワードの再設定

${SERVICE_NAME} オーナーアカウントのパスワード再設定の依頼を受け付けました。
下の URL から新しいパスワードを設定してください。

${url}

このリンクは 1 時間のみ有効です。お心当たりがない場合や、ご自身で再設定を依頼していない場合は、このメールは破棄してください。アカウントは安全です。

-- ${SERVICE_NAME}
`;
}
