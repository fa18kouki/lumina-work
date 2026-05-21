import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface InterviewCancelledCastEmailProps {
  storeName: string;
  scheduledAtFormatted: string;
}

export function InterviewCancelledCastEmail({
  storeName,
  scheduledAtFormatted,
}: InterviewCancelledCastEmailProps) {
  return (
    <NotificationLayout
      heading="面接がキャンセルされました"
      preview={`${storeName}との面接がキャンセルされました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {storeName}との面接がキャンセルされました。
      </Text>
      <Text style={{ color: "#666" }}>元の日時: {scheduledAtFormatted}</Text>
    </NotificationLayout>
  );
}
