import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@/server/notifications/types";

// nodemailer をモック
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

describe("sendEmailNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("castEmail がある場合にメールを送信する", async () => {
    vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");
    vi.stubEnv("EMAIL_SERVER_PORT", "587");
    vi.stubEnv("EMAIL_SERVER_USER", "user");
    vi.stubEnv("EMAIL_SERVER_PASSWORD", "pass");
    vi.stubEnv("EMAIL_FROM", "noreply@lumina.app");
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

    mockSendMail.mockResolvedValueOnce({});

    await sendEmailNotification(event);

    expect(mockSendMail).toHaveBeenCalledOnce();
    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toBe("cast@example.com");
    expect(callArgs.subject).toContain("Club Elegant");
    expect(callArgs.subject).toContain("LUMINA");
    expect(callArgs.html).toContain("Club Elegant");
    expect(callArgs.html).toContain("六本木");
    expect(callArgs.html).toContain("https://lumina.app/c/offers");
  });

  it("castEmail が null の場合はスキップする", async () => {
    vi.stubEnv("EMAIL_SERVER_HOST", "smtp.example.com");

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

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("EMAIL_SERVER_HOST が未設定の場合はスキップする", async () => {
    delete process.env.EMAIL_SERVER_HOST;

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

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
