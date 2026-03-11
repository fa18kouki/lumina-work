import { messagingApi } from "@line/bot-sdk";
import type { NotificationEvent } from "../types";

let client: messagingApi.MessagingApiClient | null = null;

function getLineClient(): messagingApi.MessagingApiClient | null {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return null;
  if (!client) {
    client = new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });
  }
  return client;
}

function getAppUrl(): string {
  return process.env.AUTH_URL ?? "https://lumina.app";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

type FlexBubble = messagingApi.FlexBubble;

/** ブランドカラー定数 */
const COLORS = {
  primary: "#FF69B4",
  dark: "#1a1a2e",
  danger: "#dc3545",
  success: "#28a745",
  info: "#17a2b8",
  textSub: "#999999",
  textDanger: "#dc3545",
} as const;

function buildFlexBubble(opts: {
  headerText: string;
  headerBgColor: string;
  bodyContents: messagingApi.FlexComponent[];
  footerButton?: { label: string; uri: string };
}): FlexBubble {
  const bubble: FlexBubble = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: opts.headerBgColor,
      paddingAll: "lg",
      contents: [
        {
          type: "text",
          text: opts.headerText,
          weight: "bold",
          size: "lg",
          color: "#ffffff",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "lg",
      contents: opts.bodyContents,
    },
  };

  if (opts.footerButton) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      paddingAll: "md",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: opts.footerButton.label,
            uri: opts.footerButton.uri,
          },
          style: "primary",
          color: COLORS.primary,
        },
      ],
    };
  }

  return bubble;
}

/** セパレーター */
function separator(): messagingApi.FlexComponent {
  return { type: "separator", margin: "md" };
}

/** ラベル+値の行 */
function infoRow(label: string, value: string): messagingApi.FlexComponent {
  return {
    type: "box",
    layout: "horizontal",
    margin: "sm",
    contents: [
      {
        type: "text",
        text: label,
        size: "sm",
        color: COLORS.textSub,
        flex: 0,
      },
      {
        type: "text",
        text: value,
        size: "sm",
        weight: "bold",
        align: "end",
        flex: 1,
      },
    ],
  };
}

async function pushFlexMessage(
  lineUserId: string,
  altText: string,
  bubble: FlexBubble
): Promise<void> {
  const lineClient = getLineClient();
  if (!lineClient) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN not configured, skipping");
    return;
  }

  await lineClient.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "flex",
        altText,
        contents: bubble,
      },
    ],
  });
}

export async function sendLineNotification(
  event: NotificationEvent
): Promise<void> {
  switch (event.type) {
    case "OFFER_RECEIVED": {
      const { castLineUserId, storeName, storeArea, offerMessage } =
        event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (cast: ${event.payload.castUserId}), skipping push`
        );
        return;
      }

      const bubble = buildFlexBubble({
        headerText: "✨ 新しいオファー",
        headerBgColor: COLORS.primary,
        bodyContents: [
          { type: "text", text: storeName, weight: "bold", size: "xl" },
          {
            type: "text",
            text: `📍 ${storeArea}`,
            size: "sm",
            color: COLORS.textSub,
          },
          separator(),
          {
            type: "text",
            text: offerMessage.slice(0, 100),
            wrap: true,
            size: "sm",
            margin: "md",
          },
        ],
        footerButton: {
          label: "オファーを確認する",
          uri: `${getAppUrl()}/offers`,
        },
      });

      await pushFlexMessage(
        castLineUserId,
        `${storeName}からオファーが届きました`,
        bubble
      );
      return;
    }

    case "INTERVIEW_SCHEDULED_CAST": {
      const { castLineUserId, storeName, storeAddress, scheduledAt } =
        event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (interview: ${event.payload.interviewId}), skipping push`
        );
        return;
      }

      const dateStr = formatDateTime(scheduledAt);
      const bubble = buildFlexBubble({
        headerText: "📅 面接日程確定",
        headerBgColor: COLORS.info,
        bodyContents: [
          { type: "text", text: storeName, weight: "bold", size: "xl" },
          separator(),
          infoRow("日時", dateStr),
          infoRow("場所", storeAddress),
          {
            type: "text",
            text: "遅刻・欠席の場合は事前にご連絡ください。",
            wrap: true,
            size: "xs",
            color: COLORS.textSub,
            margin: "lg",
          },
        ],
        footerButton: {
          label: "詳細を確認する",
          uri: `${getAppUrl()}/interviews`,
        },
      });

      await pushFlexMessage(
        castLineUserId,
        `${storeName}での面接日程が確定しました`,
        bubble
      );
      return;
    }

    case "INTERVIEW_CANCELLED_CAST": {
      const { castLineUserId, storeName, scheduledAt } = event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (interview: ${event.payload.interviewId}), skipping push`
        );
        return;
      }

      const dateStr = formatDateTime(scheduledAt);
      const bubble = buildFlexBubble({
        headerText: "❌ 面接キャンセル",
        headerBgColor: COLORS.danger,
        bodyContents: [
          {
            type: "text",
            text: `${storeName}との面接がキャンセルされました`,
            wrap: true,
            size: "sm",
            weight: "bold",
          },
          separator(),
          infoRow("元の日時", dateStr),
          {
            type: "text",
            text: "他のオファーをチェックして、新しい面接を探しましょう。",
            wrap: true,
            size: "xs",
            color: COLORS.textSub,
            margin: "lg",
          },
        ],
        footerButton: {
          label: "オファー一覧を見る",
          uri: `${getAppUrl()}/offers`,
        },
      });

      await pushFlexMessage(
        castLineUserId,
        `${storeName}との面接がキャンセルされました`,
        bubble
      );
      return;
    }

    case "MESSAGE_RECEIVED_CAST": {
      const { castLineUserId, senderName, messagePreview, matchId } =
        event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (match: ${matchId}), skipping push`
        );
        return;
      }

      const bubble = buildFlexBubble({
        headerText: "💬 新しいメッセージ",
        headerBgColor: COLORS.dark,
        bodyContents: [
          {
            type: "text",
            text: senderName,
            weight: "bold",
            size: "md",
          },
          separator(),
          {
            type: "text",
            text: messagePreview.slice(0, 80),
            wrap: true,
            size: "sm",
            color: COLORS.textSub,
            margin: "md",
          },
        ],
        footerButton: {
          label: "メッセージを確認する",
          uri: `${getAppUrl()}/chat/${matchId}`,
        },
      });

      await pushFlexMessage(
        castLineUserId,
        `${senderName}からメッセージが届きました`,
        bubble
      );
      return;
    }

    case "NO_SHOW_REPORTED": {
      const { castLineUserId, storeName, penaltyCount } = event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (interview: ${event.payload.interviewId}), skipping push`
        );
        return;
      }

      const bodyContents: messagingApi.FlexComponent[] = [
        {
          type: "text",
          text: `${storeName}との面接に無断欠席が報告されました。`,
          wrap: true,
          size: "sm",
        },
        separator(),
        infoRow("ペナルティ", `${penaltyCount}回目 / 3回`),
      ];

      if (penaltyCount >= 2) {
        bodyContents.push({
          type: "text",
          text: "⚠️ 次回の無断欠席でアカウントが停止されます。面接には必ず出席するか、事前にキャンセルしてください。",
          wrap: true,
          size: "sm",
          color: COLORS.textDanger,
          weight: "bold",
          margin: "lg",
        });
      } else {
        bodyContents.push({
          type: "text",
          text: "面接に出席できない場合は、事前にキャンセルをお願いします。",
          wrap: true,
          size: "xs",
          color: COLORS.textSub,
          margin: "lg",
        });
      }

      const bubble = buildFlexBubble({
        headerText: "⚠️ 無断欠席の報告",
        headerBgColor: COLORS.danger,
        bodyContents,
      });

      await pushFlexMessage(
        castLineUserId,
        `面接の無断欠席が報告されました（${penaltyCount}回目）`,
        bubble
      );
      return;
    }

    case "INTERVIEW_COMPLETED": {
      const { castLineUserId, storeName } = event.payload;
      if (!castLineUserId) {
        console.warn(
          `[LINE] lineUserId is null for event ${event.type} (interview: ${event.payload.interviewId}), skipping push`
        );
        return;
      }

      const bubble = buildFlexBubble({
        headerText: "🎉 面接完了",
        headerBgColor: COLORS.success,
        bodyContents: [
          {
            type: "text",
            text: `${storeName}との面接が完了しました。`,
            wrap: true,
            size: "sm",
          },
          {
            type: "text",
            text: "お疲れ様でした！結果をお待ちください。",
            wrap: true,
            size: "sm",
            margin: "md",
          },
          separator(),
          {
            type: "text",
            text: "他のオファーもチェックして、あなたに合ったお店を見つけましょう。",
            wrap: true,
            size: "xs",
            color: COLORS.textSub,
            margin: "lg",
          },
        ],
        footerButton: {
          label: "オファー一覧を見る",
          uri: `${getAppUrl()}/offers`,
        },
      });

      await pushFlexMessage(
        castLineUserId,
        `${storeName}との面接が完了しました`,
        bubble
      );
      return;
    }

    // 店舗向け通知 → LINE送信なし
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "INTERVIEW_SCHEDULED_STORE":
    case "INTERVIEW_CANCELLED_STORE":
    case "MESSAGE_RECEIVED_STORE":
    case "OFFER_EXPIRED":
    case "ACCOUNT_SUSPENDED":
      return;
  }
}
