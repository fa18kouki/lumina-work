import { render } from "@react-email/components";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NotificationEvent } from "@/server/notifications/types";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => mockSend(...args),
    };
  },
}));

// isStoreNotificationEnabled が prisma.owner.findUnique を叩くため最小モック。
// null を返すと「設定未保存=デフォルトON」のパスに入り、メール送信ロジックを通せる。
vi.mock("@/server/db", () => ({
  prisma: {
    owner: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

async function getCallArgs(call = 0) {
  const [emailArgs, options] = mockSend.mock.calls[call] as [
    { from: string; to: string; subject: string; react: React.ReactElement },
    { idempotencyKey?: string } | undefined,
  ];
  const html = await render(emailArgs.react);
  return {
    from: emailArgs.from,
    to: emailArgs.to,
    subject: emailArgs.subject,
    html,
    idempotencyKey: options?.idempotencyKey,
  };
}

describe("sendEmailNotification - P0イベント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    mockSend.mockResolvedValue({ data: { id: "msg" }, error: null });
  });

  describe("OFFER_ACCEPTED", () => {
    it("店舗にオファー承諾のメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");
      vi.stubEnv("EMAIL_FROM", "LUMINA <noreply@lumina.app>");

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

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("みさき");
      expect(callArgs.subject).toContain("承諾");
      expect(callArgs.html).toContain("連絡先");
      expect(callArgs.idempotencyKey).toBe("lumina:OFFER_ACCEPTED:offer-1");
    });

    it("storeEmail が null の場合はスキップする", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("OFFER_REJECTED", () => {
    it("店舗にオファー辞退のメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("回答");
      expect(callArgs.html).toContain("他のキャスト");
    });
  });

  describe("INTERVIEW_SCHEDULED_CAST", () => {
    it("キャスト向けにEmail送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("面接");
    });
  });

  describe("INTERVIEW_SCHEDULED_STORE", () => {
    it("店舗に面接確定のメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("面接");
      expect(callArgs.html).toContain("みさき");
    });
  });

  describe("INTERVIEW_CANCELLED_CAST", () => {
    it("キャストにキャンセルメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("cast@example.com");
      expect(callArgs.subject).toContain("キャンセル");
    });
  });

  describe("INTERVIEW_CANCELLED_STORE", () => {
    it("店舗にキャンセルメールを送信する", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key");

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

      await sendEmailNotification(event);

      expect(mockSend).toHaveBeenCalledOnce();
      const callArgs = await getCallArgs();
      expect(callArgs.to).toBe("store@example.com");
      expect(callArgs.subject).toContain("キャンセル");
      expect(callArgs.html).toContain("みさき");
    });
  });
});
