import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

const SERVICE_NAME = "LUMINA";

interface AdminOwnerInviteEmailProps {
  url: string;
}

export function AdminOwnerInviteEmail({ url }: AdminOwnerInviteEmailProps) {
  return (
    <NotificationLayout
      heading={`${SERVICE_NAME} オーナーへの招待`}
      ctaUrl={url}
      ctaLabel="招待を受ける"
      preview={`${SERVICE_NAME} オーナーアカウントへの招待が届いています`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {SERVICE_NAME}{" "}
        管理者からオーナーアカウントへの招待が届きました。下のボタンから招待を受けると、
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

export function buildAdminOwnerInviteSubject(): string {
  return `${SERVICE_NAME} オーナー招待のお知らせ`;
}

export function buildAdminOwnerInviteText(url: string): string {
  return `${SERVICE_NAME} オーナーへの招待

${SERVICE_NAME} 管理者からオーナーアカウントへの招待が届きました。
下の URL から招待を受けると、${SERVICE_NAME} オーナーダッシュボードにログインできるようになります。

${url}

このリンクは 24 時間のみ有効です。心当たりのない場合は、このメールは破棄してください。

-- ${SERVICE_NAME}
`;
}
