import { render } from "@react-email/components";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NotificationEvent } from "@/server/notifications/types";

// Resend SDK をモック (new Resend(apiKey) でコンストラクト可能なクラスとして提供)
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => mockSend(...args),
    };
  },
}));

describe("sendEmailNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("castEmail がある場合にメールを送信する", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "LUMINA <noreply@lumina.app>");
    vi.stubEnv("AUTH_URL", "https://lumina.app");

    const { sendEmailNotification } = await import(
      "@/server/notifications/channels/email"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-1",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: null,
        castEmail: "cast@example.com",
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "ぜひ一度お話しましょう",
      },
    };

    mockSend.mockResolvedValueOnce({ data: { id: "msg-1" }, error: null });

    await sendEmailNotification(event);

    expect(mockSend).toHaveBeenCalledOnce();
    const [emailArgs, options] = mockSend.mock.calls[0];
    expect(emailArgs.to).toBe("cast@example.com");
    expect(emailArgs.subject).toContain("Club Elegant");
    expect(emailArgs.subject).toContain("LUMINA");
    expect(emailArgs.from).toBe("LUMINA <noreply@lumina.app>");
    expect(options).toEqual({
      idempotencyKey: "lumina:OFFER_RECEIVED:offer-1",
    });
    const html = await render(emailArgs.react);
    expect(html).toContain("Club Elegant");
    expect(html).toContain("六本木");
    expect(html).toContain("https://lumina.app/c/offers");
  });

  it("castEmail が null の場合はスキップする", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const { sendEmailNotification } = await import(
      "@/server/notifications/channels/email"
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

    await sendEmailNotification(event);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("RESEND_API_KEY が未設定の場合はスキップする", async () => {
    delete process.env.RESEND_API_KEY;

    const { sendEmailNotification } = await import(
      "@/server/notifications/channels/email"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-1",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: null,
        castEmail: "cast@example.com",
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "メッセージ",
      },
    };

    await sendEmailNotification(event);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("Resend が error を返したら throw して dispatcher 側に失敗を伝える", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "LUMINA <noreply@lumina.app>");
    vi.stubEnv("AUTH_URL", "https://lumina.app");

    const { sendEmailNotification } = await import(
      "@/server/notifications/channels/email"
    );

    const event: NotificationEvent = {
      type: "OFFER_RECEIVED",
      payload: {
        offerId: "offer-fail",
        recipientUserId: "user-1",
        castUserId: "user-1",
        castLineUserId: null,
        castEmail: "cast@example.com",
        storeName: "Club Elegant",
        storeArea: "六本木",
        offerMessage: "メッセージ",
      },
    };

    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "rate limited" },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await expect(sendEmailNotification(event)).rejects.toThrow(
        /Resend send failed.*rate limited/,
      );
      // 構造化ログにも context が出ること
      expect(consoleError).toHaveBeenCalledWith(
        "[Email] Resend send failed",
        expect.objectContaining({
          to: "cast@example.com",
          error: "rate limited",
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
