import { Link, Section, Text } from "@react-email/components";

import { NotificationLayout } from "./_layout";

interface OfferAcceptedEmailProps {
  castNickname: string;
  castPhone: string | null;
  castEmail: string | null;
  castLineId: string | null;
  /** キャストが選んだ面接候補日時 (ISO8601)。旧オファー経由なら null */
  selectedScheduledAt: string | null;
  appUrl: string;
}

const contactLineStyle = { margin: "4px 0" } as const;
const linkStyle = { color: "#1a1a2e" } as const;

function formatJa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(d);
}

export function OfferAcceptedEmail({
  castNickname,
  castPhone,
  castEmail,
  castLineId,
  selectedScheduledAt,
  appUrl,
}: OfferAcceptedEmailProps) {
  const hasContact = !!(castPhone || castEmail || castLineId);

  return (
    <NotificationLayout
      heading="オファーが承諾されました"
      ctaUrl={`${appUrl}/s/offers`}
      ctaLabel="オファーを確認する"
      preview={`${castNickname}さんがオファーを承諾しました`}
    >
      <Text style={{ color: "#333", lineHeight: 1.6 }}>
        <strong>{castNickname}</strong>さんがオファーを承諾しました。
        {selectedScheduledAt
          ? "選択された面接候補日時は下記の通りです。"
          : hasContact
            ? "下記の連絡先から直接ご連絡ください。"
            : "詳細はマイページでご確認ください。"}
      </Text>
      {selectedScheduledAt ? (
        <Section
          style={{
            background: "#eff6ff",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            borderLeft: "4px solid #2563eb",
          }}
        >
          <Text
            style={{ margin: "0 0 4px", fontWeight: "bold", color: "#1e3a8a" }}
          >
            面接候補日時
          </Text>
          <Text style={{ margin: 0, color: "#1e3a8a" }}>
            {formatJa(selectedScheduledAt)}
          </Text>
        </Section>
      ) : null}
      {hasContact ? (
        <Section
          style={{
            background: "#f0fdf4",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            borderLeft: "4px solid #22c55e",
          }}
        >
          <Text
            style={{ margin: "0 0 8px", fontWeight: "bold", color: "#166534" }}
          >
            キャスト連絡先
          </Text>
          {castPhone ? (
            <Text style={contactLineStyle}>
              電話:{" "}
              <Link href={`tel:${castPhone}`} style={linkStyle}>
                {castPhone}
              </Link>
            </Text>
          ) : null}
          {castEmail ? (
            <Text style={contactLineStyle}>
              メール:{" "}
              <Link href={`mailto:${castEmail}`} style={linkStyle}>
                {castEmail}
              </Link>
            </Text>
          ) : null}
          {castLineId ? (
            <Text style={contactLineStyle}>LINE ID: {castLineId}</Text>
          ) : null}
        </Section>
      ) : null}
    </NotificationLayout>
  );
}
