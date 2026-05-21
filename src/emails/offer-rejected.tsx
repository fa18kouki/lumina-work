import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface OfferRejectedEmailProps {
  castNickname: string;
  appUrl: string;
}

export function OfferRejectedEmail({
  castNickname,
  appUrl,
}: OfferRejectedEmailProps) {
  return (
    <NotificationLayout
      heading="オファーの回答がありました"
      ctaUrl={`${appUrl}/s/casts`}
      ctaLabel="キャストを探す"
      preview={`${castNickname}さんがオファーを辞退しました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {castNickname}さんがオファーを辞退されました。他のキャストを探してみましょう。
      </Text>
    </NotificationLayout>
  );
}
