import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface InterviewCancelledStoreEmailProps {
  castNickname: string;
  scheduledAtFormatted: string;
}

export function InterviewCancelledStoreEmail({
  castNickname,
  scheduledAtFormatted,
}: InterviewCancelledStoreEmailProps) {
  return (
    <NotificationLayout
      heading="面接がキャンセルされました"
      preview={`${castNickname}さんとの面接がキャンセルされました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {castNickname}さんとの面接がキャンセルされました。
      </Text>
      <Text style={{ color: "#666" }}>元の日時: {scheduledAtFormatted}</Text>
    </NotificationLayout>
  );
}
