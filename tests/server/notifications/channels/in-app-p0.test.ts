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

describe("createInAppNotification - P0イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OFFER_ACCEPTED", () => {
    it("店舗向けにオファー承諾の通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
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

      mockCreate.mockResolvedValueOnce({ id: "notif-1" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: "store-user-1",
          type: "OFFER_ACCEPTED",
          title: "オファー承諾",
          body: "みさきさんがオファーを承諾しました",
          link: "/s/offers",
          metadata: { offerId: "offer-1", castNickname: "みさき", castEmail: undefined, castLineId: undefined, castPhone: undefined },
        },
      });
    });
  });

  describe("OFFER_REJECTED", () => {
    it("店舗向けにオファー辞退の通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "OFFER_REJECTED",
        payload: {
          recipientUserId: "store-user-1",
          offerId: "offer-1",
          storeEmail: null,
          castNickname: "みさき",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-2" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: "store-user-1",
          type: "OFFER_REJECTED",
          title: "オファー辞退",
          body: "みさきさんがオファーを辞退しました",
          link: "/s/casts",
          metadata: { offerId: "offer-1", castNickname: "みさき" },
        },
      });
    });
  });

  describe("INTERVIEW_SCHEDULED_CAST", () => {
    it("キャスト向けに面接日程確定の通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_SCHEDULED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: null,
          castEmail: null,
          storeName: "Club Elegant",
          storeAddress: "六本木",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-3" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("user-1");
      expect(data.type).toBe("INTERVIEW_SCHEDULED");
      expect(data.title).toBe("面接日程確定");
      expect(data.body).toContain("Club Elegant");
    });
  });

  describe("INTERVIEW_SCHEDULED_STORE", () => {
    it("店舗向けに面接日程確定の通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_SCHEDULED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          interviewId: "interview-1",
          storeEmail: null,
          castNickname: "みさき",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-4" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("store-user-1");
      expect(data.type).toBe("INTERVIEW_SCHEDULED");
      expect(data.title).toBe("面接日程確定");
      expect(data.body).toContain("みさき");
    });
  });

  describe("INTERVIEW_CANCELLED_CAST", () => {
    it("キャスト向けに面接キャンセルの通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_CANCELLED_CAST",
        payload: {
          recipientUserId: "user-1",
          interviewId: "interview-1",
          castLineUserId: null,
          castEmail: null,
          storeName: "Club Elegant",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-5" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("user-1");
      expect(data.type).toBe("INTERVIEW_CANCELLED");
      expect(data.title).toBe("面接キャンセル");
      expect(data.body).toContain("Club Elegant");
    });
  });

  describe("INTERVIEW_CANCELLED_STORE", () => {
    it("店舗向けに面接キャンセルの通知を作成する", async () => {
      const { createInAppNotification } = await import(
        "@/server/notifications/channels/in-app"
      );

      const event: NotificationEvent = {
        type: "INTERVIEW_CANCELLED_STORE",
        payload: {
          recipientUserId: "store-user-1",
          interviewId: "interview-1",
          storeEmail: null,
          castNickname: "みさき",
          scheduledAt: "2026-04-01T18:00:00.000Z",
        },
      };

      mockCreate.mockResolvedValueOnce({ id: "notif-6" });
      await createInAppNotification(event);

      expect(mockCreate).toHaveBeenCalledOnce();
      const data = mockCreate.mock.calls[0][0].data;
      expect(data.userId).toBe("store-user-1");
      expect(data.type).toBe("INTERVIEW_CANCELLED");
      expect(data.title).toBe("面接キャンセル");
      expect(data.body).toContain("みさき");
    });
  });
});
