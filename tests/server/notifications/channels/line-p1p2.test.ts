import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

const mockPushMessage = vi.fn();
vi.mock("@line/bot-sdk", () => ({
  messagingApi: {
    MessagingApiClient: class {
      pushMessage = mockPushMessage;
    },
  },
}));

describe("sendLineNotification - P1/P2イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("MESSAGE_RECEIVED_CAST", () => {
    it("キャストにメッセージ通知を送信する", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");
      vi.stubEnv("AUTH_URL", "https://lumina.app");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "MESSAGE_RECEIVED_CAST",
        payload: {
          recipientUserId: "user-1",
          matchId: "match-1",
          castLineUserId: "U1234567890",
          castEmail: null,
          senderName: "Club Elegant",
          messagePreview: "面接のお時間について",
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      expect(mockPushMessage).toHaveBeenCalledOnce();
      const callArgs = mockPushMessage.mock.calls[0][0];
      expect(callArgs.to).toBe("U1234567890");
      expect(callArgs.messages[0].altText).toContain("Club Elegant");
      expect(callArgs.messages[0].contents.footer).toBeDefined();
    });
  });

  describe("NO_SHOW_REPORTED", () => {
    it("キャストにノーショー通知を送信する", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "NO_SHOW_REPORTED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U1234567890",
          castEmail: null,
          storeName: "Club Elegant",
          penaltyCount: 1,
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      expect(mockPushMessage).toHaveBeenCalledOnce();
      const header = mockPushMessage.mock.calls[0][0].messages[0].contents.header;
      expect(header.backgroundColor).toBe("#dc3545");
    });

    it("penaltyCount=2の場合に警告文が含まれる", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "NO_SHOW_REPORTED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U1234567890",
          castEmail: null,
          storeName: "Club Elegant",
          penaltyCount: 2,
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      const body = mockPushMessage.mock.calls[0][0].messages[0].contents.body;
      const texts = body.contents.map((c: { text?: string }) => c.text ?? "");
      const hasWarning = texts.some((t: string) => t.includes("停止"));
      expect(hasWarning).toBe(true);
    });
  });

  describe("INTERVIEW_COMPLETED", () => {
    it("キャストに面接完了通知を送信する", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_COMPLETED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U1234567890",
          storeName: "Club Elegant",
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      expect(mockPushMessage).toHaveBeenCalledOnce();
      const header = mockPushMessage.mock.calls[0][0].messages[0].contents.header;
      expect(header.backgroundColor).toBe("#28a745");
    });
  });

  describe("ACCOUNT_SUSPENDED", () => {
    it("LINE送信しない（Emailのみ）", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "ACCOUNT_SUSPENDED",
        payload: {
          recipientUserId: "user-1",
          castEmail: "cast@example.com",
        },
      };

      await sendLineNotification(event);
      expect(mockPushMessage).not.toHaveBeenCalled();
    });
  });
});
