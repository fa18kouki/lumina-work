import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface MessageReceivedEmailProps {
  senderName: string;
  messagePreview: string;
  ctaUrl: string;
  audience: "cast" | "store";
}

export function MessageReceivedEmail({
  senderName,
  messagePreview,
  ctaUrl,
  audience,
}: MessageReceivedEmailProps) {
  const heading = "新しいメッセージ";
  const previewText =
    audience === "cast"
      ? `${senderName}からメッセージが届きました`
      : `${senderName}さんからメッセージが届きました`;
  const bodyLead =
    audience === "cast"
      ? `${senderName}からメッセージが届きました。`
      : `${senderName}さんからメッセージが届きました。`;

  return (
    <NotificationLayout
      heading={heading}
      ctaUrl={ctaUrl}
      ctaLabel="メッセージを確認する"
      preview={previewText}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>{bodyLead}</Text>
      <Text style={{ color: "#666", fontStyle: "italic" }}>
        {messagePreview.slice(0, 100)}
      </Text>
    </NotificationLayout>
  );
}
