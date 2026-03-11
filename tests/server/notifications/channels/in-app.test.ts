import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

// prisma をモック
const mockCreate = vi.fn();
vi.mock("@/server/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe("createInAppNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OFFER_RECEIVED イベントで Notification レコードを作成する", async () => {
    const { createInAppNotification } = await import(
      "@/server/notifications/channels/in-app"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        recipientUserId: "user-1",
        offerId: "offer-1",
        castUserId: "user-1",
        castLineUserId: null,
        castEmail: null,
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "ぜひ一度お話しましょう",
      },
    };

    mockCreate.mockResolvedValueOnce({ id: "notif-1" });

    await createInAppNotification(event);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "OFFER_RECEIVED",
        title: "新しいオファー",
        body: "Club Elegantからオファーが届きました",
        link: "/c/offers",
        metadata: {
          offerId: "offer-1",
          storeName: "Club Elegant",
        },
      },
    });
  });

  it("payload の storeName が body に正しく反映される", async () => {
    const { createInAppNotification } = await import(
      "@/server/notifications/channels/in-app"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        recipientUserId: "user-2",
        offerId: "offer-2",
        castUserId: "user-2",
        castLineUserId: null,
        castEmail: null,
        storeName: "Lounge Royal",
        storeArea: "銀座",
        offerMessage: "高待遇でお迎えします",
      },
    };

    mockCreate.mockResolvedValueOnce({ id: "notif-2" });

    await createInAppNotification(event);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          body: "Lounge Royalからオファーが届きました",
        }),
      })
    );
  });
});
