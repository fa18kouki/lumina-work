import { Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

export function AccountSuspendedEmail() {
  return (
    <NotificationLayout
      heading="アカウントが停止されました"
      preview="アカウントが停止されました"
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        無断欠席が規定回数に達したため、アカウントが停止されました。
      </Text>
      <Text style={{ color: "#666" }}>
        詳細についてはサポートまでお問い合わせください。
      </Text>
    </NotificationLayout>
  );
}
