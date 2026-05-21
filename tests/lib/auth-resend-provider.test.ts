import { beforeEach, describe, expect, it, vi } from "vitest";

// Resend SDK モック
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => mockSend(...args),
    };
  },
}));

describe("ResendEmailProvider sendVerificationRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("送信失敗時、例外メッセージに email PII を平文で含めない (masked になる)", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "LUMINA <noreply@lumina.app>");
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "rate limited" },
    });

    const { ResendEmailProvider } = await import("@/lib/auth-resend-provider");
    const provider = ResendEmailProvider();

    await expect(
      provider.sendVerificationRequest!({
        identifier: "alice@example.com",
        url: "https://lumina.app/api/auth/callback/nodemailer?token=xxx",
        // 残りの引数は本テストでは使わないので最小モック
        provider: { from: "LUMINA <noreply@lumina.app>" } as never,
        expires: new Date(),
        token: "tok",
        theme: {} as never,
        request: new Request("http://x"),
      }),
    ).rejects.toThrow(/Email to a\*\*\*@example\.com could not be sent.*rate limited/);
  });

  it("ローカル部の最初の 1 文字 + ドメインだけ残してマスクする", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "LUMINA <noreply@lumina.app>");
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });

    const { ResendEmailProvider } = await import("@/lib/auth-resend-provider");
    const provider = ResendEmailProvider();

    await expect(
      provider.sendVerificationRequest!({
        identifier: "bob.example.user@corp.example.co.jp",
        url: "https://lumina.app/cb",
        provider: { from: "LUMINA <noreply@lumina.app>" } as never,
        expires: new Date(),
        token: "tok",
        theme: {} as never,
        request: new Request("http://x"),
      }),
    ).rejects.toThrow(/b\*\*\*@corp\.example\.co\.jp/);
  });
});
