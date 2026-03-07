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
      contents: opts.bodyContents,
    },
  };

  if (opts.footerButton) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: opts.footerButton.label,
            uri: opts.footerButton.uri,
          },
          style: "primary",
          color: "#1a1a2e",
        },
      ],
    };
  }

  return bubble;
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
      if (!castLineUserId) return;

      const bubble = buildFlexBubble({
        headerText: "新しいオファー",
        headerBgColor: "#1a1a2e",
        bodyContents: [
          { type: "text", text: storeName, weight: "bold", size: "xl" },
          { type: "text", text: storeArea, size: "sm", color: "#999999" },
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
      if (!castLineUserId) return;

      const dateStr = formatDateTime(scheduledAt);
      const bubble = buildFlexBubble({
        headerText: "面接日程確定",
        headerBgColor: "#1a1a2e",
        bodyContents: [
          { type: "text", text: storeName, weight: "bold", size: "xl" },
          { type: "text", text: storeAddress, size: "sm", color: "#999999" },
          {
            type: "text",
            text: `日時: ${dateStr}`,
            wrap: true,
            size: "sm",
            margin: "md",
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
      if (!castLineUserId) return;

      const dateStr = formatDateTime(scheduledAt);
      const bubble = buildFlexBubble({
        headerText: "面接キャンセル",
        headerBgColor: "#dc3545",
        bodyContents: [
          {
            type: "text",
            text: `${storeName}との面接がキャンセルされました`,
            wrap: true,
            size: "sm",
          },
          {
            type: "text",
            text: `元の日時: ${dateStr}`,
            size: "sm",
            color: "#999999",
            margin: "md",
          },
        ],
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
      if (!castLineUserId) return;

      const bubble = buildFlexBubble({
        headerText: "新しいメッセージ",
        headerBgColor: "#1a1a2e",
        bodyContents: [
          {
            type: "text",
            text: `${senderName}からメッセージが届きました`,
            wrap: true,
            size: "sm",
          },
          {
            type: "text",
            text: messagePreview.slice(0, 50),
            wrap: true,
            size: "sm",
            color: "#999999",
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
      if (!castLineUserId) return;

      const bodyContents: messagingApi.FlexComponent[] = [
        {
          type: "text",
          text: `${storeName}との面接に無断欠席が報告されました。`,
          wrap: true,
          size: "sm",
        },
        {
          type: "text",
          text: `ペナルティ: ${penaltyCount}回目/3回`,
          size: "sm",
          color: "#dc3545",
          margin: "md",
        },
      ];

      if (penaltyCount === 2) {
        bodyContents.push({
          type: "text",
          text: "次回の無断欠席でアカウントが停止されます。",
          wrap: true,
          size: "sm",
          color: "#dc3545",
          weight: "bold",
          margin: "md",
        });
      }

      const bubble = buildFlexBubble({
        headerText: "無断欠席の報告",
        headerBgColor: "#dc3545",
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
      if (!castLineUserId) return;

      const bubble = buildFlexBubble({
        headerText: "面接完了",
        headerBgColor: "#28a745",
        bodyContents: [
          {
            type: "text",
            text: `${storeName}との面接が完了しました。お疲れ様でした！`,
            wrap: true,
            size: "sm",
          },
        ],
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
