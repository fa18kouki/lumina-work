import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

// ---- Prisma mocks
const adminInvitationFindUnique = vi.fn();
const adminInvitationFindMany = vi.fn();
const adminInvitationCreate = vi.fn();
const adminInvitationUpdate = vi.fn();
const adminInvitationUpsert = vi.fn();

const prismaMock = {
  adminInvitation: {
    findUnique: (...args: unknown[]) => adminInvitationFindUnique(...args),
    findMany: (...args: unknown[]) => adminInvitationFindMany(...args),
    create: (...args: unknown[]) => adminInvitationCreate(...args),
    update: (...args: unknown[]) => adminInvitationUpdate(...args),
    upsert: (...args: unknown[]) => adminInvitationUpsert(...args),
  },
  // $transaction はコールバックに同じ prisma 形状を渡すことで、
  // tx.adminInvitation.X 呼び出しがそのまま個別 mock に届くようにする。
  $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prismaMock)),
};

vi.mock("@/server/db", () => ({
  prisma: prismaMock,
}));

// ---- Supabase admin client mock
const inviteUserByEmail = vi.fn();
const deleteUser = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      admin: {
        inviteUserByEmail: (...args: unknown[]) =>
          inviteUserByEmail(...args),
        deleteUser: (...args: unknown[]) => deleteUser(...args),
      },
    },
  }),
}));

// ---- next/headers cookies() mock (replaced per-test)
let cookieValueForTest: string | undefined = undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === ADMIN_SESSION_COOKIE && cookieValueForTest !== undefined
        ? { value: cookieValueForTest }
        : undefined,
    getAll: () => [],
    has: (name: string) =>
      name === ADMIN_SESSION_COOKIE && cookieValueForTest !== undefined,
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

function loginWithValidCookie() {
  cookieValueForTest = createAdminSessionCookie(SECRET);
}

function clearCookie() {
  cookieValueForTest = undefined;
}

describe("adminPanel.invite — 認可", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  });

  it("admin-session cookie が無いと UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.list({}),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("改ざんされた cookie は UNAUTHORIZED", async () => {
    cookieValueForTest = "garbage.value";
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.list({}),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("ADMIN_API_KEY 未設定なら INTERNAL_SERVER_ERROR", async () => {
    delete process.env.ADMIN_API_KEY;
    loginWithValidCookie();
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.list({}),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("adminPanel.invite.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("Prisma から取り出した招待一覧を返す", async () => {
    const rows = [
      {
        id: "inv-1",
        email: "a@example.com",
        status: "PENDING",
        createdAt: new Date(),
      },
      {
        id: "inv-2",
        email: "b@example.com",
        status: "ACCEPTED",
        createdAt: new Date(),
      },
    ];
    adminInvitationFindMany.mockResolvedValue(rows);
    const caller = await createCaller();
    const result = await caller.adminPanel.invite.list({});
    expect(adminInvitationFindMany).toHaveBeenCalledOnce();
    expect(result).toEqual(rows);
  });

  it("status フィルタを Prisma の where に流す", async () => {
    adminInvitationFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.invite.list({ status: "PENDING" });
    expect(adminInvitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } }),
    );
  });
});

describe("adminPanel.invite.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
    loginWithValidCookie();
    inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "sb-uuid-1", email: "new@example.com" } },
      error: null,
    });
    adminInvitationFindUnique.mockResolvedValue(null);
    adminInvitationCreate.mockImplementation(({ data }) => ({
      id: "inv-new",
      ...data,
      status: data.status ?? "PENDING",
      createdAt: new Date(),
    }));
    adminInvitationUpsert.mockImplementation(({ where, create, update }) => ({
      id: "inv-new",
      email: where.email,
      status: "PENDING",
      createdAt: new Date(),
      supabaseUserId: null,
      ...(create ?? {}),
      ...(update ?? {}),
    }));
  });

  it("Supabase inviteUserByEmail と Prisma upsert を呼ぶ", async () => {
    const caller = await createCaller();
    const result = await caller.adminPanel.invite.create({
      email: "new@example.com",
    });
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "new@example.com",
      expect.objectContaining({
        // 既存のオーナー callback を再利用 (PKCE 交換 + Prisma 上の
        // User/Owner provisioning + AdminInvitation 受諾マーク まで一気通貫)
        redirectTo: "https://example.test/api/auth/callback?next=/o/dashboard",
      }),
    );
    expect(adminInvitationUpsert).toHaveBeenCalledOnce();
    expect(result.email).toBe("new@example.com");
    expect(result.status).toBe("PENDING");
  });

  it("既存の PENDING 招待がある email は CONFLICT", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-existing",
      email: "dup@example.com",
      status: "PENDING",
    });
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.create({ email: "dup@example.com" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("REVOKED 状態の email は再招待でき、PENDING に戻す", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-old",
      email: "revoked@example.com",
      status: "REVOKED",
    });
    adminInvitationUpsert.mockImplementation(({ where, update }) => ({
      id: "inv-old",
      email: where.email,
      status: "PENDING",
      ...update,
    }));
    const caller = await createCaller();
    const result = await caller.adminPanel.invite.create({
      email: "revoked@example.com",
    });
    expect(inviteUserByEmail).toHaveBeenCalledOnce();
    expect(adminInvitationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "PENDING" }),
      }),
    );
    expect(result.status).toBe("PENDING");
  });

  it("Supabase がエラーを返したら INTERNAL_SERVER_ERROR、claim 行は REVOKED にロールバック", async () => {
    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { message: "rate limited" },
    });
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.create({ email: "err@example.com" }),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    // upsert で claim はされた (Supabase 呼ぶ前)
    expect(adminInvitationUpsert).toHaveBeenCalledOnce();
    // 失敗ロールバックで update が REVOKED に呼ばれた
    expect(adminInvitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REVOKED" }),
      }),
    );
  });

  it("Supabase + ロールバック両方失敗時もエラーを投げ、両方の文脈を含める", async () => {
    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { message: "rate limited" },
    });
    adminInvitationUpdate.mockRejectedValueOnce(
      new Error("db connection lost"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      const caller = await createCaller();
      await expect(
        caller.adminPanel.invite.create({ email: "double-fail@example.com" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        // Supabase 由来 + rollback 由来の両方の文字列を含むこと
        message: expect.stringMatching(
          /Supabase invite failed.*rate limited.*rollback also failed.*db connection lost/s,
        ),
      });
      // 構造化ログにも両方の情報が出ること
      expect(consoleError).toHaveBeenCalledWith(
        "[admin-panel.invite.create] rollback failed",
        expect.objectContaining({
          supabaseError: "rate limited",
          rollbackError: "db connection lost",
        }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("adminPanel.invite.resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("PENDING 招待を再送し lastSentAt を更新", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "PENDING",
      supabaseUserId: "sb-1",
    });
    inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "sb-1" } },
      error: null,
    });
    adminInvitationUpdate.mockImplementation(({ where, data }) => ({
      id: where.id,
      email: "x@example.com",
      ...data,
    }));
    const caller = await createCaller();
    await caller.adminPanel.invite.resend({ id: "inv-1" });
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "x@example.com",
      expect.any(Object),
    );
    expect(adminInvitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: expect.objectContaining({
          status: "PENDING",
        }),
      }),
    );
  });

  it("ACCEPTED 招待は再送拒否 BAD_REQUEST", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "ACCEPTED",
    });
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.resend({ id: "inv-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("存在しない id は NOT_FOUND", async () => {
    adminInvitationFindUnique.mockResolvedValue(null);
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.resend({ id: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("adminPanel.invite.revoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("Supabase deleteUser を呼んで REVOKED にする", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "PENDING",
      supabaseUserId: "sb-1",
    });
    deleteUser.mockResolvedValue({ data: null, error: null });
    adminInvitationUpdate.mockImplementation(({ where, data }) => ({
      id: where.id,
      ...data,
    }));
    const caller = await createCaller();
    await caller.adminPanel.invite.revoke({ id: "inv-1" });
    expect(deleteUser).toHaveBeenCalledWith("sb-1");
    expect(adminInvitationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REVOKED" }),
      }),
    );
  });

  it("ACCEPTED 招待は失効拒否 BAD_REQUEST", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-1",
      status: "ACCEPTED",
    });
    const caller = await createCaller();
    await expect(
      caller.adminPanel.invite.revoke({ id: "inv-1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("supabaseUserId が null の場合は deleteUser を呼ばずに REVOKED 更新", async () => {
    adminInvitationFindUnique.mockResolvedValue({
      id: "inv-1",
      status: "PENDING",
      supabaseUserId: null,
    });
    adminInvitationUpdate.mockImplementation(({ where, data }) => ({
      id: where.id,
      ...data,
    }));
    const caller = await createCaller();
    await caller.adminPanel.invite.revoke({ id: "inv-1" });
    expect(deleteUser).not.toHaveBeenCalled();
    expect(adminInvitationUpdate).toHaveBeenCalled();
  });
});
