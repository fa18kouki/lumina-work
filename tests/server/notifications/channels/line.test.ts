import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

// LINE Bot SDK をモック
const mockPushMessage = vi.fn();
vi.mock("@line/bot-sdk", () => ({
  messagingApi: {
    MessagingApiClient: class {
      pushMessage = mockPushMessage;
    },
  },
}));

describe("sendLineNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("castLineUserId がある場合に LINE push を送信する", async () => {
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");
    vi.stubEnv("AUTH_URL", "https://lumina.app");

    const { sendLineNotification } = await import(
      "@/server/notifications/channels/line"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-1",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: "U1234567890",
        castEmail: null,
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "ぜひ一度お話しましょう",
      },
    };

    mockPushMessage.mockResolvedValueOnce({});

    await sendLineNotification(event);

    expect(mockPushMessage).toHaveBeenCalledOnce();
    const callArgs = mockPushMessage.mock.calls[0][0];
    expect(callArgs.to).toBe("U1234567890");
    expect(callArgs.messages).toHaveLength(1);
    expect(callArgs.messages[0].type).toBe("flex");
    expect(callArgs.messages[0].altText).toContain("Club Elegant");
  });

  it("castLineUserId が null の場合はスキップする", async () => {
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "test-token");

    const { sendLineNotification } = await import(
      "@/server/notifications/channels/line"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-1",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: null,
        castEmail: null,
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "メッセージ",
      },
    };

    await sendLineNotification(event);

    expect(mockPushMessage).not.toHaveBeenCalled();
  });

  it("LINE_CHANNEL_ACCESS_TOKEN が未設定の場合はスキップする", async () => {
    // トークン未設定
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;

    const { sendLineNotification } = await import(
      "@/server/notifications/channels/line"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-1",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: "U1234567890",
        castEmail: null,
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "メッセージ",
      },
    };

    await sendLineNotification(event);

    expect(mockPushMessage).not.toHaveBeenCalled();
  });
});
