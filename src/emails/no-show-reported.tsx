import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface NoShowReportedEmailProps {
  storeName: string;
  penaltyCount: number;
}

export function NoShowReportedEmail({
  storeName,
  penaltyCount,
}: NoShowReportedEmailProps) {
  return (
    <NotificationLayout
      heading="無断欠席が報告されました"
      preview={`${storeName}との面接に無断欠席が報告されました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        {storeName}との面接に無断欠席が報告されました。
      </Text>
      <Text style={{ color: "#dc3545" }}>
        ペナルティ: {penaltyCount}回目/3回
      </Text>
      {penaltyCount === 2 ? (
        <Text style={{ color: "#dc3545", fontWeight: "bold" }}>
          次回の無断欠席でアカウントが停止されます。
        </Text>
      ) : null}
    </NotificationLayout>
  );
}
