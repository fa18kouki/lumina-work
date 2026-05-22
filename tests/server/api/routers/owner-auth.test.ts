import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- Supabase admin client mock
const generateLink = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: () => ({
    auth: { admin: { generateLink: (...a: unknown[]) => generateLink(...a) } },
  }),
}));

// ---- Resend mock
const resendEmailsSend = vi.fn();
vi.mock("@/lib/resend", () => ({
  getEmailFrom: () => "LUMINA <noreply@example.test>",
  getResend: () => ({
    emails: { send: (...a: unknown[]) => resendEmailsSend(...a) },
  }),
  IDEMPOTENCY_NAMESPACE: "lumina",
}));

// next/headers cookies は publicProcedure では中身不要だが trpc.ts が cookies() を呼ぶので mock
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    set: () => {},
    delete: () => {},
  }),
}));

async function createCaller() {
  const { createInnerTRPCContext } = await import("@/server/api/trpc");
  const { appRouter } = await import("@/server/api/root");
  const ctx = createInnerTRPCContext({ session: null });
  return appRouter.createCaller(ctx);
}

const FAKE_LINK =
  "https://example.supabase.co/auth/v1/verify?token=t&type=signup&redirect_to=https://example.test/api/auth/callback";

function mockGenerateLinkSuccess(type: string, userId = "sb-uuid-1") {
  generateLink.mockResolvedValue({
    data: {
      properties: {
        action_link: FAKE_LINK,
        email_otp: "0",
        hashed_token: "h",
        redirect_to: "https://example.test/o/login",
        verification_type: type,
      },
      user: { id: userId, email: "new@example.com" },
    },
    error: null,
  });
}

function mockResendSuccess() {
  resendEmailsSend.mockResolvedValue({
    data: { id: "resend-id-1" },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  mockResendSuccess();
});

describe("ownerAuth.requestSignup", () => {
  it("generateLink({ type: 'signup' }) を呼んで Resend で送信し OK を返す", async () => {
    mockGenerateLinkSuccess("signup");
    const caller = await createCaller();
    const result = await caller.ownerAuth.requestSignup({
      email: "new@example.com",
      password: "secret-12345",
    });
    expect(result).toEqual({ ok: true });
    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "signup",
        email: "new@example.com",
        password: "secret-12345",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining(
            "/api/auth/callback?next=%2Fo%2Fdashboard",
          ),
        }),
      }),
    );
    expect(resendEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@example.com",
        subject: "LUMINA オーナー登録の確認",
        from: "LUMINA <noreply@example.test>",
      }),
    );
    const sendArg = resendEmailsSend.mock.calls[0]?.[0] as { text: string };
    expect(sendArg.text).toContain(FAKE_LINK);
  });

  it("referralCode は redirectTo の ?ref= に乗せる (大文字化)", async () => {
    mockGenerateLinkSuccess("signup");
    const caller = await createCaller();
    await caller.ownerAuth.requestSignup({
      email: "new@example.com",
      password: "secret-12345",
      referralCode: "lumina-abc123",
    });
    const arg = generateLink.mock.calls[0]?.[0] as {
      options: { redirectTo: string };
    };
    expect(arg.options.redirectTo).toContain("&ref=LUMINA-ABC123");
  });

  it("既存登録済みの email は CONFLICT (Supabase が already 系メッセージを返す)", async () => {
    generateLink.mockResolvedValue({
      data: { user: null, properties: null },
      error: { message: "User already registered" },
    });
    const caller = await createCaller();
    await expect(
      caller.ownerAuth.requestSignup({
        email: "dup@example.com",
        password: "secret-12345",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(resendEmailsSend).not.toHaveBeenCalled();
  });

  it("Supabase の generic エラー (例 rate limit) は INTERNAL_SERVER_ERROR", async () => {
    generateLink.mockResolvedValue({
      data: { user: null, properties: null },
      error: { message: "rate limit exceeded" },
    });
    const caller = await createCaller();
    await expect(
      caller.ownerAuth.requestSignup({
        email: "err@example.com",
        password: "secret-12345",
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("Supabase signup failed"),
    });
    expect(resendEmailsSend).not.toHaveBeenCalled();
  });

  it("Resend send が失敗したら INTERNAL_SERVER_ERROR", async () => {
    mockGenerateLinkSuccess("signup");
    resendEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "resend down" },
    });
    const caller = await createCaller();
    await expect(
      caller.ownerAuth.requestSignup({
        email: "rs@example.com",
        password: "secret-12345",
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("Resend send failed"),
    });
  });

  it("8 文字未満のパスワードは zod で BAD_REQUEST", async () => {
    const caller = await createCaller();
    await expect(
      caller.ownerAuth.requestSignup({
        email: "weak@example.com",
        password: "short",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(generateLink).not.toHaveBeenCalled();
  });
});

describe("ownerAuth.requestPasswordReset", () => {
  it("generateLink({ type: 'recovery' }) を呼んで Resend で送信し OK を返す", async () => {
    mockGenerateLinkSuccess("recovery");
    const caller = await createCaller();
    const result = await caller.ownerAuth.requestPasswordReset({
      email: "user@example.com",
    });
    expect(result).toEqual({ ok: true });
    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "recovery",
        email: "user@example.com",
        options: expect.objectContaining({
          redirectTo: "https://example.test/o/reset-password",
        }),
      }),
    );
    expect(resendEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "LUMINA パスワード再設定のお知らせ",
      }),
    );
  });

  it("存在しない email は success のフリ (enumeration 防止)", async () => {
    generateLink.mockResolvedValue({
      data: { user: null, properties: null },
      error: { message: "User not found" },
    });
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const caller = await createCaller();
      const result = await caller.ownerAuth.requestPasswordReset({
        email: "ghost@example.com",
      });
      expect(result).toEqual({ ok: true });
      expect(resendEmailsSend).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("silently succeeding"),
        expect.any(Object),
      );
    } finally {
      consoleWarn.mockRestore();
    }
  });

  it("rate limit などの generic エラーは INTERNAL_SERVER_ERROR", async () => {
    generateLink.mockResolvedValue({
      data: { user: null, properties: null },
      error: { message: "rate limit exceeded" },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const caller = await createCaller();
      await expect(
        caller.ownerAuth.requestPasswordReset({ email: "user@example.com" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: expect.stringContaining("Supabase recovery failed"),
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  it("Resend send が失敗したら INTERNAL_SERVER_ERROR", async () => {
    mockGenerateLinkSuccess("recovery");
    resendEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "resend down" },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const caller = await createCaller();
      await expect(
        caller.ownerAuth.requestPasswordReset({ email: "user@example.com" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: expect.stringContaining("Resend send failed"),
      });
    } finally {
      consoleError.mockRestore();
    }
  });
});
