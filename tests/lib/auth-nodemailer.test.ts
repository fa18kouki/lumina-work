import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("next-auth/providers/nodemailer", () => ({
  default: vi.fn((config) => ({ id: "nodemailer", name: "Nodemailer", ...config })),
}));

const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe("Nodemailer provider - sendVerificationRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.AUTH_LINE_ID = "line-id";
    process.env.AUTH_LINE_SECRET = "line-secret";
    process.env.AUTH_TWITTER_ID = "twitter-id";
    process.env.AUTH_TWITTER_SECRET = "twitter-secret";
    process.env.EMAIL_SERVER_HOST = "smtp.example.com";
    process.env.EMAIL_SERVER_PORT = "587";
    process.env.EMAIL_SERVER_USER = "user";
    process.env.EMAIL_SERVER_PASSWORD = "password";
    process.env.EMAIL_FROM = "noreply@lumina.app";
  });

  it("Nodemailer provider に sendVerificationRequest が定義されている", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<
      typeof vi.fn
    >;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer"
    );
    expect(emailProvider).toBeDefined();
    expect(emailProvider.sendVerificationRequest).toBeTypeOf("function");
  });

  it("sendVerificationRequest が「マッチング」を含まない件名でメールを送る", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<
      typeof vi.fn
    >;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer"
    );
    mockSendMail.mockResolvedValueOnce({ accepted: ["user@example.com"], rejected: [] });

    await emailProvider.sendVerificationRequest({
      identifier: "user@example.com",
      url: "https://lumina.app/api/auth/callback/nodemailer?token=xxx",
      provider: {
        server: emailProvider.server,
        from: emailProvider.from,
      },
      request: new Request("https://lumina.app"),
      expires: new Date(Date.now() + 86400000),
      token: "tok",
      theme: {},
    });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const mailOptions = mockSendMail.mock.calls[0][0];
    expect(mailOptions.to).toBe("user@example.com");
    expect(mailOptions.subject).not.toContain("マッチング");
    expect(mailOptions.html).not.toContain("マッチング");
    expect(mailOptions.text).not.toContain("マッチング");
    expect(mailOptions.subject).toMatch(/ルミナ|LUMINA/);
  });
});
