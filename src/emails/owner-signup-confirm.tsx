import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

const SERVICE_NAME = "LUMINA";

interface OwnerSignupConfirmEmailProps {
  url: string;
}

/**
 * Owner 自己登録時の確認メール。
 * 送信主体は `src/server/auth/owner-email.ts` の `sendOwnerSignupConfirmEmail` (Resend SDK)。
 */
export function OwnerSignupConfirmEmail({ url }: OwnerSignupConfirmEmailProps) {
  return (
    <NotificationLayout
      heading={`${SERVICE_NAME} オーナー登録の確認`}
      ctaUrl={url}
      ctaLabel="メールアドレスを確認する"
      preview={`${SERVICE_NAME} オーナー登録の確認メールが届いています`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {SERVICE_NAME}{" "}
        にオーナーとしてご登録いただきありがとうございます。下のボタンからメールアドレスの確認を完了すると、
        {SERVICE_NAME} オーナーダッシュボードにログインできるようになります。
      </Text>
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        このリンクは 24
        時間のみ有効です。心当たりのない場合は、このメールは破棄してください。
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

export function buildOwnerSignupConfirmSubject(): string {
  return `${SERVICE_NAME} オーナー登録の確認`;
}

export function buildOwnerSignupConfirmText(url: string): string {
  return `${SERVICE_NAME} オーナー登録の確認

${SERVICE_NAME} にオーナーとしてご登録いただきありがとうございます。
下の URL からメールアドレスの確認を完了すると、${SERVICE_NAME} オーナーダッシュボードにログインできるようになります。

${url}

このリンクは 24 時間のみ有効です。心当たりのない場合は、このメールは破棄してください。

-- ${SERVICE_NAME}
`;
}
