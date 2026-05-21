import { describe, it, expect, vi, beforeEach } from "vitest";

// モック設定
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

// Resend は src/lib/auth-resend-provider 経由で使われる。テストでは
// import 時に実 API を呼ばないよう Resend モジュール自体を no-op に置く。
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));

describe("Auth Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AUTH_LINE_ID = "line-id";
    process.env.AUTH_LINE_SECRET = "line-secret";
    process.env.AUTH_TWITTER_ID = "twitter-id";
    process.env.AUTH_TWITTER_SECRET = "twitter-secret";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "LUMINA <noreply@example.com>";
  });

  it("should export auth handlers", async () => {
    const auth = await import("@/lib/auth");
    expect(auth.handlers).toBeDefined();
    expect(auth.signIn).toBeDefined();
    expect(auth.signOut).toBeDefined();
    expect(auth.auth).toBeDefined();
  });

  it("should have 3 providers configured (LINE, X, Email)", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    expect(NextAuth).toHaveBeenCalled();
    const config = NextAuth.mock.calls[0][0];
    expect(config.providers).toHaveLength(3);
  });

  it("should include LINE provider", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const lineProvider = config.providers.find(
      (p: { id: string }) => p.id === "line"
    );
    expect(lineProvider).toBeDefined();
  });

  it("should include X (Twitter) provider", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const twitterProvider = config.providers.find(
      (p: { id: string }) => p.id === "twitter"
    );
    expect(twitterProvider).toBeDefined();
  });

  it("should include Email (Nodemailer) provider", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    const emailProvider = config.providers.find(
      (p: { id: string }) => p.id === "nodemailer"
    );
    expect(emailProvider).toBeDefined();
  });

  it("should have custom session callback", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    expect(config.callbacks?.session).toBeDefined();
  });

  it("should have custom sign-in page configured", async () => {
    const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
    await import("@/lib/auth");

    const config = NextAuth.mock.calls[0][0];
    expect(config.pages?.signIn).toBe("/c/login");
  });
});
