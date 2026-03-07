import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

describe("sendEmailNotification - P1/P2イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("MESSAGE_RECEIVED_STORE", () => {
    it("店舗にメッセージ通知メールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

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

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("みさき");
    });
  });

  describe("NO_SHOW_REPORTED", () => {
    it("キャストにノーショーメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

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

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.html).toContain("1回目/3回");
    });
  });

  describe("ACCOUNT_SUSPENDED", () => {
    it("キャストにアカウント停止メールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

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

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("停止");
    });
  });

  describe("OFFER_EXPIRED", () => {
    it("店舗にオファー期限切れメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

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

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("期限");
      expect(callArgs.html).toContain("みさき");
    });
  });
});
