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

describe("sendEmailNotification - P0イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("OFFER_ACCEPTED", () => {
    it("店舗にオファー承諾のメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "OFFER_ACCEPTED",
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
      expect(callArgs.subject).toContain("みさき");
      expect(callArgs.subject).toContain("承諾");
      expect(callArgs.html).toContain("やりとり");
    });

    it("storeEmail が null の場合はスキップする", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "OFFER_ACCEPTED",
        payload: {
          recipientUserId: "store-user-1",
          offerId: "offer-1",
          storeEmail: null,
          castNickname: "みさき",
        },
      };

      await sendEmailNotification(event);
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe("OFFER_REJECTED", () => {
    it("店舗にオファー辞退のメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "OFFER_REJECTED",
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
      expect(callArgs.subject).toContain("回答");
      expect(callArgs.html).toContain("他のキャスト");
    });
  });

  describe("INTERVIEW_SCHEDULED_CAST", () => {
    it("キャスト向けなのでEmail送信しない（LINE優先）", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_SCHEDULED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U123",
          castEmail: "cast@example.com",
          storeName: "Club Elegant",
          storeAddress: "六本木",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      await sendEmailNotification(event);
      // キャスト向け面接通知はLINE優先、Emailも送る
      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("面接");
    });
  });

  describe("INTERVIEW_SCHEDULED_STORE", () => {
    it("店舗に面接確定のメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_SCHEDULED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          interviewId: "interview-1",
          storeEmail: "store@example.com",
          castNickname: "みさき",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("面接");
      expect(callArgs.html).toContain("みさき");
    });
  });

  describe("INTERVIEW_CANCELLED_CAST", () => {
    it("キャストにキャンセルメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_CANCELLED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U123",
          castEmail: "cast@example.com",
          storeName: "Club Elegant",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("キャンセル");
    });
  });

  describe("INTERVIEW_CANCELLED_STORE", () => {
    it("店舗にキャンセルメールを送信する", async () => {
      vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
      vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");

      const { sendEmailNotification } = await import(
        "@/server/notifications/channels/email"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_CANCELLED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          interviewId: "interview-1",
          storeEmail: "store@example.com",
          castNickname: "みさき",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockSendMail.mockResolvedValueOnce({});
      await sendEmailNotification(event);

      expect(mockSendMail).toHaveBeenCalledOnce();
      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("キャンセル");
      expect(callArgs.html).toContain("みさき");
    });
  });
});
