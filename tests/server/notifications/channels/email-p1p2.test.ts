import { render } from "@react-email/components";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NotificationEvent } from "@/server/notifications/types";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => mockSend(...args),
    };
  },
}));

vi.mock("@/server/db", () => ({
  prisma: {
    owner: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

async function getCallArgs(call = 0) {
  const [emailArgs] = mockSend.mock.calls[call] as [
    { from: string; to: string; subject: string; react: React.ReactElement },
  ];
  const html = await render(emailArgs.react);
  return {
    to: emailArgs.to,
    subject: emailArgs.subject,
    html,
  };
}

describe("sendEmailNotification - P1/P2イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    mockSend.mockResolvedValue({ data: { id: "msg" }, error: null });
  });

  describe("MESSAGE_RECEIVED_STORE", () => {
    it("店舗にメッセージ通知メールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "MESSAGE_RECEIVED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          matchId: "match-1",
          storeEmail: "store@example.com",
          senderName: "みさき",
          messagePreview: "明日の面接について確認したいのですが",
        },
      };

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("みさき");
    });
  });

  describe("NO_SHOW_REPORTED", () => {
    it("キャストにノーショーメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "NO_SHOW_REPORTED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: null,
          castEmail: "cast@example.com",
          storeName: "Club Elegant",
          penaltyCount: 1,
        },
      };

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.html).toContain("1回目/3回");
    });
  });

  describe("ACCOUNT_SUSPENDED", () => {
    it("キャストにアカウント停止メールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "ACCOUNT_SUSPENDED",
        payload: {
          recipientUserId: "user-1",
          castEmail: "cast@example.com",
        },
      };

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("停止");
    });
  });

  describe("OFFER_EXPIRED", () => {
    it("店舗にオファー期限切れメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "OFFER_EXPIRED",
        payload: {
          recipientUserId: "store-user-1",
          offerId: "offer-1",
          storeEmail: "store@example.com",
          castNickname: "みさき",
        },
      };

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("期限");
      expect(callArgs.html).toContain("みさき");
    });
  });
});
