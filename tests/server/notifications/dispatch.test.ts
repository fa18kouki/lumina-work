import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

// 各チャネルをモック
const mockCreateInApp = vi.fn();
const mockSendLine = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/server/notifications/channels/in-app", () => ({
  createInAppNotification: (...args: unknown[]) => mockCreateInApp(...args),
}));

vi.mock("@/server/notifications/channels/line", () => ({
  sendLineNotification: (...args: unknown[]) => mockSendLine(...args),
}));

vi.mock("@/server/notifications/channels/email", () => ({
  sendEmailNotification: (...args: unknown[]) => mockSendEmail(...args),
}));

describe("dispatchNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const event: NotificationEvent = {
    type: "OFFER_RECEIVED",
    payload: {
      offerId: "offer-1",
      recipientUserId: "user-1",
      castUserId: "user-1",
      castLineUserId: "U123",
      castEmail: "test@example.com",
      storeName: "Club Elegant",
      storeArea: "六本木",
      offerMessage: "テスト",
    },
  };

  it("3つのチャネルすべてを呼び出す", async () => {
    const { dispatchNotification } = await import(
      "@/server/notifications/index"
    );

    mockCreateInApp.mockResolvedValueOnce(undefined);
    mockSendLine.mockResolvedValueOnce(undefined);
    mockSendEmail.mockResolvedValueOnce(undefined);

    await dispatchNotification(event);

    expect(mockCreateInApp).toHaveBeenCalledWith(event);
    expect(mockSendLine).toHaveBeenCalledWith(event);
    expect(mockSendEmail).toHaveBeenCalledWith(event);
  });

  it("1つのチャネルが失敗しても他のチャネルは実行される", async () => {
    const { dispatchNotification } = await import(
      "@/server/notifications/index"
    );

    mockCreateInApp.mockResolvedValueOnce(undefined);
    mockSendLine.mockRejectedValueOnce(new Error("LINE API error"));
    mockSendEmail.mockResolvedValueOnce(undefined);

    // 例外を投げないこと
    await expect(dispatchNotification(event)).resolves.toBeUndefined();

    expect(mockCreateInApp).toHaveBeenCalledWith(event);
    expect(mockSendLine).toHaveBeenCalledWith(event);
    expect(mockSendEmail).toHaveBeenCalledWith(event);
  });

  it("全チャネルが失敗しても例外を投げない", async () => {
    const { dispatchNotification } = await import(
      "@/server/notifications/index"
    );

    mockCreateInApp.mockRejectedValueOnce(new Error("DB error"));
    mockSendLine.mockRejectedValueOnce(new Error("LINE error"));
    mockSendEmail.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(dispatchNotification(event)).resolves.toBeUndefined();
  });
});
