import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

const mockCreate = vi.fn();
vi.mock("@/server/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe("createInAppNotification - P1/P2イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("MESSAGE_RECEIVED_CAST", () => {
    it("キャスト向けにメッセージ通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "MESSAGE_RECEIVED_CAST",
        payload: {
          recipientUserId: "user-1",
          matchId: "match-1",
          castLineUserId: null,
          castEmail: null,
          senderName: "Club Elegant",
          messagePreview: "面接について",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-1" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("user-1");
      expect(data.type).toBe("MESSAGE_RECEIVED");
      expect(data.link).toBe("/chat/match-1");
    });
  });

  describe("MESSAGE_RECEIVED_STORE", () => {
    it("店舗向けにメッセージ通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "MESSAGE_RECEIVED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          matchId: "match-1",
          storeEmail: null,
          senderName: "みさき",
          messagePreview: "よろしくお願いします",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-2" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("store-user-1");
      expect(data.type).toBe("MESSAGE_RECEIVED");
      expect(data.link).toBe("/store/chat/match-1");
    });
  });

  describe("NO_SHOW_REPORTED", () => {
    it("キャスト向けにノーショー通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "NO_SHOW_REPORTED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: null,
          castEmail: null,
          storeName: "Club Elegant",
          penaltyCount: 2,
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-3" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.type).toBe("NO_SHOW_REPORTED");
      expect(data.body).toContain("2回目/3回");
    });
  });

  describe("INTERVIEW_COMPLETED", () => {
    it("キャスト向けに面接完了通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_COMPLETED",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: null,
          storeName: "Club Elegant",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-4" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.type).toBe("INTERVIEW_COMPLETED");
      expect(data.body).toContain("お疲れ様");
    });
  });

  describe("ACCOUNT_SUSPENDED", () => {
    it("キャスト向けにアカウント停止通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "ACCOUNT_SUSPENDED",
        payload: {
          recipientUserId: "user-1",
          castEmail: null,
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-5" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.type).toBe("ACCOUNT_SUSPENDED");
      expect(data.body).toContain("停止");
    });
  });

  describe("OFFER_EXPIRED", () => {
    it("店舗向けにオファー期限切れ通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "OFFER_EXPIRED",
        payload: {
          recipientUserId: "store-user-1",
          offerId: "offer-1",
          storeEmail: null,
          castNickname: "みさき",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-6" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.type).toBe("OFFER_EXPIRED");
      expect(data.body).toContain("みさき");
      expect(data.body).toContain("期限切れ");
    });
  });
});
