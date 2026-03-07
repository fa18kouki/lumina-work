import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type { NotificationType } from "@prisma/client";
import type { NotificationEvent } from "../types";

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

async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link ?? null,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}

export async function createInAppNotification(
  event: NotificationEvent
): Promise<void> {
  switch (event.type) {
    case "OFFER_RECEIVED": {
      const { recipientUserId, storeName, offerId } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "OFFER_RECEIVED",
        title: "新しいオファー",
        body: `${storeName}からオファーが届きました`,
        link: "/offers",
        metadata: { offerId, storeName },
      });
      return;
    }

    case "OFFER_ACCEPTED": {
      const { recipientUserId, offerId, castNickname } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "OFFER_ACCEPTED",
        title: "オファー承諾",
        body: `${castNickname}さんがオファーを承諾しました`,
        link: "/store/matches",
        metadata: { offerId, castNickname },
      });
      return;
    }

    case "OFFER_REJECTED": {
      const { recipientUserId, offerId, castNickname } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "OFFER_REJECTED",
        title: "オファー辞退",
        body: `${castNickname}さんがオファーを辞退しました`,
        link: "/store/casts",
        metadata: { offerId, castNickname },
      });
      return;
    }

    case "INTERVIEW_SCHEDULED_CAST": {
      const { recipientUserId, interviewId, storeName, scheduledAt } =
        event.payload;
      const dateStr = formatDateTime(scheduledAt);
      await createNotification({
        userId: recipientUserId,
        type: "INTERVIEW_SCHEDULED",
        title: "面接日程確定",
        body: `${storeName}との面接が${dateStr}に確定しました`,
        link: "/interviews",
        metadata: { interviewId, storeName, scheduledAt },
      });
      return;
    }

    case "INTERVIEW_SCHEDULED_STORE": {
      const { recipientUserId, interviewId, castNickname, scheduledAt } =
        event.payload;
      const dateStr = formatDateTime(scheduledAt);
      await createNotification({
        userId: recipientUserId,
        type: "INTERVIEW_SCHEDULED",
        title: "面接日程確定",
        body: `${castNickname}さんとの面接が${dateStr}に確定しました`,
        link: "/store/interviews",
        metadata: { interviewId, castNickname, scheduledAt },
      });
      return;
    }

    case "INTERVIEW_CANCELLED_CAST": {
      const { recipientUserId, interviewId, storeName, scheduledAt } =
        event.payload;
      const dateStr = formatDateTime(scheduledAt);
      await createNotification({
        userId: recipientUserId,
        type: "INTERVIEW_CANCELLED",
        title: "面接キャンセル",
        body: `${storeName}との面接（${dateStr}）がキャンセルされました`,
        link: "/interviews",
        metadata: { interviewId, storeName, scheduledAt },
      });
      return;
    }

    case "INTERVIEW_CANCELLED_STORE": {
      const { recipientUserId, interviewId, castNickname, scheduledAt } =
        event.payload;
      const dateStr = formatDateTime(scheduledAt);
      await createNotification({
        userId: recipientUserId,
        type: "INTERVIEW_CANCELLED",
        title: "面接キャンセル",
        body: `${castNickname}さんとの面接（${dateStr}）がキャンセルされました`,
        link: "/store/interviews",
        metadata: { interviewId, castNickname, scheduledAt },
      });
      return;
    }

    case "MESSAGE_RECEIVED_CAST": {
      const { recipientUserId, matchId, senderName } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "MESSAGE_RECEIVED",
        title: "新しいメッセージ",
        body: `${senderName}からメッセージが届きました`,
        link: `/chat/${matchId}`,
        metadata: { matchId, senderName },
      });
      return;
    }

    case "MESSAGE_RECEIVED_STORE": {
      const { recipientUserId, matchId, senderName } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "MESSAGE_RECEIVED",
        title: "新しいメッセージ",
        body: `${senderName}さんからメッセージが届きました`,
        link: `/store/chat/${matchId}`,
        metadata: { matchId, senderName },
      });
      return;
    }

    case "NO_SHOW_REPORTED": {
      const { recipientUserId, interviewId, storeName, penaltyCount } =
        event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "NO_SHOW_REPORTED",
        title: "無断欠席の報告",
        body: `${storeName}との面接に無断欠席が報告されました（${penaltyCount}回目/3回）`,
        metadata: { interviewId, storeName, penaltyCount },
      });
      return;
    }

    case "INTERVIEW_COMPLETED": {
      const { recipientUserId, interviewId, storeName } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "INTERVIEW_COMPLETED",
        title: "面接完了",
        body: `${storeName}との面接が完了しました。お疲れ様でした！`,
        link: "/interviews",
        metadata: { interviewId, storeName },
      });
      return;
    }

    case "ACCOUNT_SUSPENDED": {
      const { recipientUserId } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "ACCOUNT_SUSPENDED",
        title: "アカウント停止",
        body: "無断欠席が規定回数に達したため、アカウントが停止されました",
      });
      return;
    }

    case "OFFER_EXPIRED": {
      const { recipientUserId, offerId, castNickname } = event.payload;
      await createNotification({
        userId: recipientUserId,
        type: "OFFER_EXPIRED",
        title: "オファー期限切れ",
        body: `${castNickname}さんへのオファーが期限切れになりました`,
        link: "/store/casts",
        metadata: { offerId, castNickname },
      });
      return;
    }
  }
}
