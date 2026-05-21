import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface InterviewScheduledCastEmailProps {
  storeName: string;
  storeAddress: string;
  scheduledAtFormatted: string;
  appUrl: string;
}

export function InterviewScheduledCastEmail({
  storeName,
  storeAddress,
  scheduledAtFormatted,
  appUrl,
}: InterviewScheduledCastEmailProps) {
  return (
    <NotificationLayout
      heading="面接日程が確定しました"
      ctaUrl={`${appUrl}/c/matches`}
      ctaLabel="詳細を確認する"
      preview={`${storeName}での面接が確定しました`}
    >
      <Section
        style={{
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "18px" }}>
          {storeName}
        </Text>
        <Text style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          {storeAddress}
        </Text>
        <Text style={{ margin: "8px 0 0", fontSize: "16px" }}>
          日時: {scheduledAtFormatted}
        </Text>
      </Section>
    </NotificationLayout>
  );
}
