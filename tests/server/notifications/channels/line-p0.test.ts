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

describe("sendLineNotification - P0イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("INTERVIEW_SCHEDULED_CAST", () => {
    it("キャストにFlex Messageで面接日程通知を送信する", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");
      vi.stubEnv("AUTH_URL", "https://lumina.app");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_SCHEDULED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U1234567890",
          castEmail: null,
          storeName: "Club Elegant",
          storeAddress: "東京都港区六本木1-1-1",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      expect(mockPushMessage).toHaveBeenCalledOnce();
      const callArgs = mockPushMessage.mock.calls[0][0];
      expect(callArgs.to).toBe("U1234567890");
      expect(callArgs.messages[0].type).toBe("flex");
      expect(callArgs.messages[0].altText).toContain("面接日程");
      // ヘッダー背景色はinfo色 #17a2b8
      const header = callArgs.messages[0].contents.header;
      expect(header.backgroundColor).toBe("#17a2b8");
    });
  });

  describe("INTERVIEW_CANCELLED_CAST", () => {
    it("キャストにFlex Messageで面接キャンセル通知を送信する", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");
      vi.stubEnv("AUTH_URL", "https://lumina.app");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_CANCELLED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: "U1234567890",
          castEmail: null,
          storeName: "Club Elegant",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockPushMessage.mockResolvedValueOnce({});
      await sendLineNotification(event);

      expect(mockPushMessage).toHaveBeenCalledOnce();
      const callArgs = mockPushMessage.mock.calls[0][0];
      expect(callArgs.to).toBe("U1234567890");
      expect(callArgs.messages[0].altText).toContain("キャンセル");
      // ヘッダー背景色は警告色 #dc3545
      const header = callArgs.messages[0].contents.header;
      expect(header.backgroundColor).toBe("#dc3545");
    });
  });

  describe("OFFER_ACCEPTED / OFFER_REJECTED", () => {
    it("店舗向け通知なのでLINE送信しない (OFFER_ACCEPTED)", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
      );

      const event: NotificationEvent = {
        type: "OFFER_ACCEPTED",
        payload: {
          recipientUserId: "store-user-1",
          offerId: "offer-1",
          storeEmail: "store@example.com",
          castNickname: "みさき",
          castLineId: null,
          castPhone: null,
          castEmail: null,
        },
      };

      await sendLineNotification(event);
      expect(mockPushMessage).not.toHaveBeenCalled();
    });

    it("店舗向け通知なのでLINE送信しない (OFFER_REJECTED)", async () => {
      vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

      const { sendLineNotification } = await import(
        "@/server/notifications/channels/line"
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

      await sendLineNotification(event);
      expect(mockPushMessage).not.toHaveBeenCalled();
    });
  });
});
