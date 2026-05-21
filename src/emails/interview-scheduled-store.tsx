import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface InterviewScheduledStoreEmailProps {
  castNickname: string;
  scheduledAtFormatted: string;
  appUrl: string;
}

export function InterviewScheduledStoreEmail({
  castNickname,
  scheduledAtFormatted,
  appUrl,
}: InterviewScheduledStoreEmailProps) {
  return (
    <NotificationLayout
      heading="面接が確定しました"
      ctaUrl={`${appUrl}/s/interviews`}
      ctaLabel="面接を確認する"
      preview={`${castNickname}さんとの面接が確定しました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        <strong>{castNickname}</strong>さんとの面接が確定しました。
      </Text>
      <Text style={{ color: "#333" }}>日時: {scheduledAtFormatted}</Text>
    </NotificationLayout>
  );
}
