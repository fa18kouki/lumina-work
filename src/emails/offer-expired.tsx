import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface OfferExpiredEmailProps {
  castNickname: string;
  appUrl: string;
}

export function OfferExpiredEmail({
  castNickname,
  appUrl,
}: OfferExpiredEmailProps) {
  return (
    <NotificationLayout
      heading="オファーの期限が切れました"
      ctaUrl={`${appUrl}/s/casts`}
      ctaLabel="キャストを探す"
      preview={`${castNickname}さんへのオファーが期限切れになりました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {castNickname}さんへのオファーが期限切れになりました。
      </Text>
    </NotificationLayout>
  );
}
