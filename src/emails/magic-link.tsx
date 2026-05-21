import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

const SERVICE_NAME = "ルミナ";

interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <NotificationLayout
      heading={`${SERVICE_NAME}にログインする`}
      ctaUrl={url}
      ctaLabel={`${SERVICE_NAME}にログイン`}
      preview={`${SERVICE_NAME} のログインリンクが届いています`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {SERVICE_NAME}
        をご利用いただきありがとうございます。下のボタンからログインしてください。
      </Text>
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        このリンクは短時間のみ有効です。心当たりのない場合は、このメールは破棄してください。
      </Text>
      <Section style={{ marginTop: "24px" }}>
        <Text style={{ color: "#999", fontSize: "12px", lineHeight: 1.6 }}>
          ボタンが動作しない場合は、次の URL をブラウザに直接貼り付けてください:
        </Text>
        <Text style={{ color: "#999", fontSize: "12px", wordBreak: "break-all" }}>
          {url}
        </Text>
      </Section>
    </NotificationLayout>
  );
}

export function buildMagicLinkSubject(): string {
  return `【${SERVICE_NAME}】ログイン用リンクのお知らせ`;
}

export function buildMagicLinkText(url: string): string {
  return `${SERVICE_NAME}にログイン

${SERVICE_NAME}をご利用いただきありがとうございます。
下の URL からログインしてください。

${url}

このリンクは短時間のみ有効です。心当たりのない場合は、このメールは破棄してください。

-- ${SERVICE_NAME}
`;
}
