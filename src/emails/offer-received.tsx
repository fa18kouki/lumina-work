import { Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface OfferReceivedEmailProps {
  storeName: string;
  storeArea: string;
  offerMessage: string;
  appUrl: string;
}

export function OfferReceivedEmail({
  storeName,
  storeArea,
  offerMessage,
  appUrl,
}: OfferReceivedEmailProps) {
  return (
    <NotificationLayout
      heading="新しいオファーが届きました"
      ctaUrl={`${appUrl}/c/offers`}
      ctaLabel="オファーを確認する"
      preview={`${storeName}からオファーが届きました`}
    >
      <Section
        style={{
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "18px" }}
        >
          {storeName}
        </Text>
        <Text style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          {storeArea}
        </Text>
      </Section>
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {offerMessage.slice(0, 200)}
      </Text>
    </NotificationLayout>
  );
}
