import nodemailer from "nodemailer";
import type { NotificationEvent } from "../types";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.EMAIL_SERVER_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  return transporter;
}

function getAppUrl(): string {
  return process.env.AUTH_URL ?? "https://lumina.app";
}

function getFrom(): string {
  return process.env.EMAIL_FROM ?? "noreply@lumina.app";
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

function buildEmailHtml(opts: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const ctaBlock = opts.ctaLabel && opts.ctaUrl
    ? `<div style="text-align: center; margin-top: 24px;">
        <a href="${opts.ctaUrl}"
           style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          ${opts.ctaLabel}
        </a>
      </div>`
    : "";

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">LUMINA</h1>
      </div>
      <div style="padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a2e; margin-top: 0;">${opts.heading}</h2>
        ${opts.bodyHtml}
        ${ctaBlock}
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>このメールはLUMINAから自動送信されています。</p>
      </div>
    </div>
  `;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("[Email] EMAIL_SERVER_HOST not configured, skipping");
    return;
  }

  await mailer.sendMail({
    from: getFrom(),
    to,
    subject: `【LUMINA】${subject}`,
    html,
  });
}

export async function sendEmailNotification(
  event: NotificationEvent
): Promise<void> {
  switch (event.type) {
    case "OFFER_RECEIVED": {
      const { castEmail, storeName, storeArea, offerMessage } = event.payload;
      if (!castEmail) return;

      await sendMail(
        castEmail,
        `${storeName}からオファーが届きました`,
        buildEmailHtml({
          heading: "新しいオファーが届きました",
          bodyHtml: `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 4px; font-weight: bold; font-size: 18px;">${storeName}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">${storeArea}</p>
            </div>
            <p style="color: #333; line-height: 1.6;">${offerMessage.slice(0, 200)}</p>
          `,
          ctaLabel: "オファーを確認する",
          ctaUrl: `${getAppUrl()}/c/offers`,
        })
      );
      return;
    }

    case "OFFER_ACCEPTED": {
      const { storeEmail, castNickname, castLineId, castPhone, castEmail } = event.payload;
      if (!storeEmail) return;

      const contactLines: string[] = [];
      if (castPhone) contactLines.push(`<p style="margin: 4px 0;">電話: <a href="tel:${castPhone}" style="color: #1a1a2e;">${castPhone}</a></p>`);
      if (castEmail) contactLines.push(`<p style="margin: 4px 0;">メール: <a href="mailto:${castEmail}" style="color: #1a1a2e;">${castEmail}</a></p>`);
      if (castLineId) contactLines.push(`<p style="margin: 4px 0;">LINE ID: ${castLineId}</p>`);

      const contactSection = contactLines.length > 0
        ? `<div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #166534;">キャスト連絡先</p>
            ${contactLines.join("")}
          </div>`
        : "";

      await sendMail(
        storeEmail,
        `${castNickname}さんがオファーを承諾しました`,
        buildEmailHtml({
          heading: "オファーが承諾されました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              <strong>${castNickname}</strong>さんがオファーを承諾しました。下記の連絡先から直接ご連絡ください。
            </p>
            ${contactSection}
          `,
          ctaLabel: "オファーを確認する",
          ctaUrl: `${getAppUrl()}/s/offers`,
        })
      );
      return;
    }

    case "OFFER_REJECTED": {
      const { storeEmail, castNickname } = event.payload;
      if (!storeEmail) return;

      await sendMail(
        storeEmail,
        "オファーの回答がありました",
        buildEmailHtml({
          heading: "オファーの回答がありました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${castNickname}さんがオファーを辞退されました。他のキャストを探してみましょう。
            </p>
          `,
          ctaLabel: "キャストを探す",
          ctaUrl: `${getAppUrl()}/s/casts`,
        })
      );
      return;
    }

    case "INTERVIEW_SCHEDULED_CAST": {
      const { castEmail, storeName, storeAddress, scheduledAt } = event.payload;
      if (!castEmail) return;

      const dateStr = formatDateTime(scheduledAt);
      await sendMail(
        castEmail,
        `${storeName}での面接が確定しました`,
        buildEmailHtml({
          heading: "面接日程が確定しました",
          bodyHtml: `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 4px; font-weight: bold; font-size: 18px;">${storeName}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">${storeAddress}</p>
              <p style="margin: 8px 0 0; font-size: 16px;">日時: ${dateStr}</p>
            </div>
          `,
          ctaLabel: "詳細を確認する",
          ctaUrl: `${getAppUrl()}/c/matches`,
        })
      );
      return;
    }

    case "INTERVIEW_SCHEDULED_STORE": {
      const { storeEmail, castNickname, scheduledAt } = event.payload;
      if (!storeEmail) return;

      const dateStr = formatDateTime(scheduledAt);
      await sendMail(
        storeEmail,
        "面接が確定しました",
        buildEmailHtml({
          heading: "面接が確定しました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              <strong>${castNickname}</strong>さんとの面接が確定しました。
            </p>
            <p style="color: #333;">日時: ${dateStr}</p>
          `,
          ctaLabel: "面接を確認する",
          ctaUrl: `${getAppUrl()}/s/interviews`,
        })
      );
      return;
    }

    case "INTERVIEW_CANCELLED_CAST": {
      const { castEmail, storeName, scheduledAt } = event.payload;
      if (!castEmail) return;

      const dateStr = formatDateTime(scheduledAt);
      await sendMail(
        castEmail,
        "面接がキャンセルされました",
        buildEmailHtml({
          heading: "面接がキャンセルされました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${storeName}との面接がキャンセルされました。
            </p>
            <p style="color: #666;">元の日時: ${dateStr}</p>
          `,
        })
      );
      return;
    }

    case "INTERVIEW_CANCELLED_STORE": {
      const { storeEmail, castNickname, scheduledAt } = event.payload;
      if (!storeEmail) return;

      const dateStr = formatDateTime(scheduledAt);
      await sendMail(
        storeEmail,
        "面接がキャンセルされました",
        buildEmailHtml({
          heading: "面接がキャンセルされました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${castNickname}さんとの面接がキャンセルされました。
            </p>
            <p style="color: #666;">元の日時: ${dateStr}</p>
          `,
        })
      );
      return;
    }

    case "MESSAGE_RECEIVED_CAST": {
      const { castEmail, senderName, messagePreview } = event.payload;
      if (!castEmail) return;

      await sendMail(
        castEmail,
        `${senderName}からメッセージが届きました`,
        buildEmailHtml({
          heading: "新しいメッセージ",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${senderName}からメッセージが届きました。
            </p>
            <p style="color: #666; font-style: italic;">${messagePreview.slice(0, 100)}</p>
          `,
          ctaLabel: "メッセージを確認する",
          ctaUrl: `${getAppUrl()}/c/chat/${event.payload.matchId}`,
        })
      );
      return;
    }

    case "MESSAGE_RECEIVED_STORE": {
      const { storeEmail, senderName, messagePreview } = event.payload;
      if (!storeEmail) return;

      await sendMail(
        storeEmail,
        `${senderName}さんからメッセージ`,
        buildEmailHtml({
          heading: "新しいメッセージ",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${senderName}さんからメッセージが届きました。
            </p>
            <p style="color: #666; font-style: italic;">${messagePreview.slice(0, 100)}</p>
          `,
          ctaLabel: "メッセージを確認する",
          ctaUrl: `${getAppUrl()}/s/chat/${event.payload.matchId}`,
        })
      );
      return;
    }

    case "NO_SHOW_REPORTED": {
      const { castEmail, storeName, penaltyCount } = event.payload;
      if (!castEmail) return;

      let warningHtml = "";
      if (penaltyCount === 2) {
        warningHtml = `<p style="color: #dc3545; font-weight: bold;">次回の無断欠席でアカウントが停止されます。</p>`;
      }

      await sendMail(
        castEmail,
        "無断欠席の報告",
        buildEmailHtml({
          heading: "無断欠席が報告されました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${storeName}との面接に無断欠席が報告されました。
            </p>
            <p style="color: #dc3545;">ペナルティ: ${penaltyCount}回目/3回</p>
            ${warningHtml}
          `,
        })
      );
      return;
    }

    case "INTERVIEW_COMPLETED": {
      // キャスト向けはLINEのみ
      return;
    }

    case "ACCOUNT_SUSPENDED": {
      const { castEmail } = event.payload;
      if (!castEmail) return;

      await sendMail(
        castEmail,
        "アカウント停止のお知らせ",
        buildEmailHtml({
          heading: "アカウントが停止されました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              無断欠席が規定回数に達したため、アカウントが停止されました。
            </p>
            <p style="color: #666;">
              詳細についてはサポートまでお問い合わせください。
            </p>
          `,
        })
      );
      return;
    }

    case "OFFER_EXPIRED": {
      const { storeEmail, castNickname } = event.payload;
      if (!storeEmail) return;

      await sendMail(
        storeEmail,
        "オファーの期限が切れました",
        buildEmailHtml({
          heading: "オファーの期限が切れました",
          bodyHtml: `
            <p style="color: #333; line-height: 1.6;">
              ${castNickname}さんへのオファーが期限切れになりました。
            </p>
          `,
          ctaLabel: "キャストを探す",
          ctaUrl: `${getAppUrl()}/s/casts`,
        })
      );
      return;
    }
  }
}
