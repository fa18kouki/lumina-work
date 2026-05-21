import type React from "react";

import { AccountSuspendedEmail } from "@/emails/account-suspended";
import { InterviewCancelledCastEmail } from "@/emails/interview-cancelled-cast";
import { InterviewCancelledStoreEmail } from "@/emails/interview-cancelled-store";
import { InterviewScheduledCastEmail } from "@/emails/interview-scheduled-cast";
import { InterviewScheduledStoreEmail } from "@/emails/interview-scheduled-store";
import { MessageReceivedEmail } from "@/emails/message-received";
import { NoShowReportedEmail } from "@/emails/no-show-reported";
import { OfferAcceptedEmail } from "@/emails/offer-accepted";
import { OfferExpiredEmail } from "@/emails/offer-expired";
import { OfferReceivedEmail } from "@/emails/offer-received";
import { OfferRejectedEmail } from "@/emails/offer-rejected";
import { getAppUrl } from "@/lib/app-url";
import { EMAIL_FROM, IDEMPOTENCY_NAMESPACE, getResend } from "@/lib/resend";
import { prisma } from "@/server/db";

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

interface EmailPayload {
  to: string;
  subject: string;
  react: React.ReactElement;
  idempotencyKey?: string;
}

/**
 * NotificationEvent → 送信ペイロード (to/subject/react) に変換する純粋関数。
 * email 不在の場合や設定で OFF の場合は null を返してスキップを伝える。
 */
export function buildEmailPayload(event: NotificationEvent): EmailPayload | null {
  const appUrl = getAppUrl();

  switch (event.type) {
    case "OFFER_RECEIVED": {
      const { castEmail, storeName, storeArea, offerMessage, offerId } =
        event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: `【LUMINA】${storeName}からオファーが届きました`,
        react: (
          <OfferReceivedEmail
            storeName={storeName}
            storeArea={storeArea}
            offerMessage={offerMessage}
            appUrl={appUrl}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:OFFER_RECEIVED:${offerId}`,
      };
    }

    case "OFFER_ACCEPTED": {
      const { storeEmail, castNickname, castPhone, castEmail, castLineId, offerId } =
        event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: `【LUMINA】${castNickname}さんがオファーを承諾しました`,
        react: (
          <OfferAcceptedEmail
            castNickname={castNickname}
            castPhone={castPhone}
            castEmail={castEmail}
            castLineId={castLineId}
            appUrl={appUrl}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:OFFER_ACCEPTED:${offerId}`,
      };
    }

    case "OFFER_REJECTED": {
      const { storeEmail, castNickname, offerId } = event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: "【LUMINA】オファーの回答がありました",
        react: <OfferRejectedEmail castNickname={castNickname} appUrl={appUrl} />,
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:OFFER_REJECTED:${offerId}`,
      };
    }

    case "INTERVIEW_SCHEDULED_CAST": {
      const {
        castEmail,
        storeName,
        storeAddress,
        scheduledAt,
        interviewId,
      } = event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: `【LUMINA】${storeName}での面接が確定しました`,
        react: (
          <InterviewScheduledCastEmail
            storeName={storeName}
            storeAddress={storeAddress}
            scheduledAtFormatted={formatDateTime(scheduledAt)}
            appUrl={appUrl}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:INTERVIEW_SCHEDULED_CAST:${interviewId}`,
      };
    }

    case "INTERVIEW_SCHEDULED_STORE": {
      const { storeEmail, castNickname, scheduledAt, interviewId } =
        event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: "【LUMINA】面接が確定しました",
        react: (
          <InterviewScheduledStoreEmail
            castNickname={castNickname}
            scheduledAtFormatted={formatDateTime(scheduledAt)}
            appUrl={appUrl}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:INTERVIEW_SCHEDULED_STORE:${interviewId}`,
      };
    }

    case "INTERVIEW_CANCELLED_CAST": {
      const { castEmail, storeName, scheduledAt, interviewId } = event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: "【LUMINA】面接がキャンセルされました",
        react: (
          <InterviewCancelledCastEmail
            storeName={storeName}
            scheduledAtFormatted={formatDateTime(scheduledAt)}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:INTERVIEW_CANCELLED_CAST:${interviewId}:${scheduledAt}`,
      };
    }

    case "INTERVIEW_CANCELLED_STORE": {
      const { storeEmail, castNickname, scheduledAt, interviewId } =
        event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: "【LUMINA】面接がキャンセルされました",
        react: (
          <InterviewCancelledStoreEmail
            castNickname={castNickname}
            scheduledAtFormatted={formatDateTime(scheduledAt)}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:INTERVIEW_CANCELLED_STORE:${interviewId}:${scheduledAt}`,
      };
    }

    case "MESSAGE_RECEIVED_CAST": {
      const { castEmail, senderName, messagePreview, matchId } = event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: `【LUMINA】${senderName}からメッセージが届きました`,
        react: (
          <MessageReceivedEmail
            senderName={senderName}
            messagePreview={messagePreview}
            ctaUrl={`${appUrl}/c/chat/${matchId}`}
            audience="cast"
          />
        ),
      };
    }

    case "MESSAGE_RECEIVED_STORE": {
      const { storeEmail, senderName, messagePreview, matchId } = event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: `【LUMINA】${senderName}さんからメッセージ`,
        react: (
          <MessageReceivedEmail
            senderName={senderName}
            messagePreview={messagePreview}
            ctaUrl={`${appUrl}/s/chat/${matchId}`}
            audience="store"
          />
        ),
      };
    }

    case "NO_SHOW_REPORTED": {
      const { castEmail, storeName, penaltyCount, interviewId } = event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: "【LUMINA】無断欠席の報告",
        react: (
          <NoShowReportedEmail
            storeName={storeName}
            penaltyCount={penaltyCount}
          />
        ),
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:NO_SHOW_REPORTED:${interviewId}`,
      };
    }

    case "INTERVIEW_COMPLETED":
      // キャスト向けはLINEのみ (email 経路なし)
      return null;

    case "ACCOUNT_SUSPENDED": {
      const { castEmail, recipientUserId } = event.payload;
      if (!castEmail) return null;
      return {
        to: castEmail,
        subject: "【LUMINA】アカウント停止のお知らせ",
        react: <AccountSuspendedEmail />,
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:ACCOUNT_SUSPENDED:${recipientUserId}`,
      };
    }

    case "OFFER_EXPIRED": {
      const { storeEmail, castNickname, offerId } = event.payload;
      if (!storeEmail) return null;
      return {
        to: storeEmail,
        subject: "【LUMINA】オファーの期限が切れました",
        react: <OfferExpiredEmail castNickname={castNickname} appUrl={appUrl} />,
        idempotencyKey: `${IDEMPOTENCY_NAMESPACE}:OFFER_EXPIRED:${offerId}`,
      };
    }
  }
}

/** 店舗のnotificationSettingsを取得し、指定キーがfalseなら送信をスキップ */
async function isStoreNotificationEnabled(
  recipientUserId: string,
  settingKey: string,
): Promise<boolean> {
  const owner = await prisma.owner.findUnique({
    where: { userId: recipientUserId },
    select: { stores: { select: { notificationSettings: true }, take: 1 } },
  });
  const store = owner?.stores[0];
  if (!store?.notificationSettings) return true;
  const settings = store.notificationSettings as Record<string, boolean>;
  return settings[settingKey] !== false;
}

async function send(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping");
    return;
  }
  const resend = getResend();
  const { error } = await resend.emails.send(
    {
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      react: payload.react,
    },
    payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {},
  );
  if (error) {
    // 構造化ログは context (to/subject/idempotencyKey) と共にここで出し、
    // dispatcher (Promise.allSettled) でも channel-tagged で 1 行残るよう throw する。
    // throw しないと dispatcher 側からは「email も成功した」ように見えて、
    // SLO 監視 / リトライ判断 / アラート がすべて空振りになる。
    console.error("[Email] Resend send failed", {
      to: payload.to,
      subject: payload.subject,
      idempotencyKey: payload.idempotencyKey ?? null,
      error: error.message,
    });
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

export async function sendEmailNotification(
  event: NotificationEvent,
): Promise<void> {
  // 店舗向けオファー関連通知の設定チェック
  const offerResponseEvents = [
    "OFFER_ACCEPTED",
    "OFFER_REJECTED",
    "OFFER_EXPIRED",
  ] as const;
  if ((offerResponseEvents as readonly string[]).includes(event.type)) {
    const enabled = await isStoreNotificationEnabled(
      event.payload.recipientUserId,
      "offerResponse",
    );
    if (!enabled) {
      console.log(
        `[Email] Skipped ${event.type}: offerResponse notification disabled`,
      );
      return;
    }
  }

  const payload = buildEmailPayload(event);
  if (!payload) return;

  await send(payload);
}
