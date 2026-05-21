import { render } from "@react-email/components";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({
  prisma: {},
}));

vi.mock("next-auth", () => ({
  default: vi.fn((config) => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
    config,
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/line", () => ({
  default: vi.fn((config) => ({ id: "line", name: "LINE", ...config })),
}));

vi.mock("next-auth/providers/twitter", () => ({
  default: vi.fn((config) => ({ id: "twitter", name: "Twitter", ...config })),
}));

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => mockSend(...args),
    };
  },
}));

describe("NextAuth Resend email provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.AUTH_LINE_ID = "line-id";
    process.env.AUTH_LINE_SECRET = "line-secret";
    process.env.AUTH_TWITTER_ID = "twitter-id";
    process.env.AUTH_TWITTER_SECRET = "twitter-secret";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "LUMINA <noreply@lumina.app>";
  });

  it("Resend ベースの email provider が登録されている (id=nodemailer)", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<
      typeof vi.fn
    >;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer",
    );
    expect(emailProvider).toBeDefined();
    expect(emailProvider.type).toBe("email");
    expect(emailProvider.sendVerificationRequest).toBeTypeOf("function");
  });

  it("sendVerificationRequest が Resend SDK を呼び、件名/本文に「マッチング」を含まない", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<
      typeof vi.fn
    >;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer",
    );

    mockSend.mockResolvedValueOnce({ data: { id: "msg-1" }, error: null });

    await emailProvider.sendVerificationRequest({
      identifier: "user@example.com",
      url: "https://lumina.app/api/auth/callback/nodemailer?token=xxx",
      provider: emailProvider,
      request: new Request("https://lumina.app"),
      expires: new Date(Date.now() + 86400000),
      token: "tok",
      theme: {},
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const args = mockSend.mock.calls[0][0];
    expect(args.to).toBe("user@example.com");
    expect(args.from).toBe("LUMINA <noreply@lumina.app>");
    expect(args.subject).not.toContain("マッチング");
    expect(args.subject).toMatch(/ルミナ|LUMINA/);
    const html = await render(args.react);
    expect(html).not.toContain("マッチング");
    expect(html).toContain(
      "https://lumina.app/api/auth/callback/nodemailer?token=xxx",
    );
    expect(args.text).not.toContain("マッチング");
  });

  it("Resend がエラーを返したら throw", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<
      typeof vi.fn
    >;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer",
    );

    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "rate limited" },
    });

    await expect(
      emailProvider.sendVerificationRequest({
        identifier: "user@example.com",
        url: "https://lumina.app/api/auth/callback/nodemailer?token=xxx",
        provider: emailProvider,
        request: new Request("https://lumina.app"),
        expires: new Date(Date.now() + 86400000),
        token: "tok",
        theme: {},
      }),
    ).rejects.toThrow(/rate limited/);
  });
});
