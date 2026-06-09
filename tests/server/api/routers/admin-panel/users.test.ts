import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

const userFindMany = vi.fn();
const userFindFirst = vi.fn();
const userUpdate = vi.fn();

const prismaMock = {
  user: {
    findMany: (...args: unknown[]) => userFindMany(...args),
    findFirst: (...args: unknown[]) => userFindFirst(...args),
    update: (...args: unknown[]) => userUpdate(...args),
  },
};

vi.mock("@/server/db", () => ({
  prisma: prismaMock,
}));

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
  headers: async () => ({
    get: () => null,
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

describe("adminPanel.users.list — 認可", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
  });

  it("admin-session cookie が無いと UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(caller.adminPanel.users.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(userFindMany).not.toHaveBeenCalled();
  });
});

describe("adminPanel.users.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("Prisma からユーザー一覧を返し、nextCursor は limit を超えた場合のみ付く", async () => {
    const rows = Array.from({ length: 11 }).map((_, i) => ({
      id: `u-${i}`,
      email: `u${i}@example.com`,
      role: "CAST",
      createdAt: new Date(),
      cast: null,
      owner: null,
    }));
    userFindMany.mockResolvedValue(rows);
    const caller = await createCaller();
    const result = await caller.adminPanel.users.list({ limit: 10 });
    expect(userFindMany).toHaveBeenCalledOnce();
    expect(result.users).toHaveLength(10);
    expect(result.nextCursor).toBe("u-10");
  });

  it("deletedAt: null を常に where に付与する (退会済み除外の保証)", async () => {
    userFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.users.list({});
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it("role / search フィルタを Prisma に流す", async () => {
    userFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.users.list({
      role: "OWNER",
      search: "alice@example.com",
    });
    const call = userFindMany.mock.calls[0]?.[0];
    expect(call.where.role).toBe("OWNER");
    expect(call.where.OR).toEqual([
      { email: { contains: "alice@example.com", mode: "insensitive" } },
      { phone: { contains: "alice@example.com" } },
    ]);
  });
});

describe("adminPanel.users.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("退会済みユーザーは NOT_FOUND (findFirst が null を返す)", async () => {
    userFindFirst.mockResolvedValue(null);
    const caller = await createCaller();
    await expect(
      caller.adminPanel.users.getById({ userId: "u-1" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u-1", deletedAt: null },
      }),
    );
  });
});

describe("adminPanel.users.exportCastsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("有効なキャストユーザーをCSVとして返す", async () => {
    userFindMany.mockResolvedValue([
      {
        id: "u-1",
        email: "cast@example.com",
        phone: "09000000000",
        createdAt: new Date("2026-05-24T00:00:00.000Z"),
        cast: {
          id: "c-1",
          nickname: 'みな, A',
          fullName: "山田みな",
          age: 24,
          birthDate: new Date("2002-01-02T00:00:00.000Z"),
          rank: "A",
          idVerified: true,
          isSuspended: false,
          desiredAreas: ["錦", "栄"],
          desiredHourlyRate: 5000,
          desiredMonthlyIncome: 500000,
          availableDaysPerWeek: 3,
          instagramId: "mina",
          lineId: "mina-line",
        },
      },
    ]);

    const caller = await createCaller();
    const result = await caller.adminPanel.users.exportCastsCsv();

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "CAST", deletedAt: null },
      }),
    );
    expect(result.count).toBe(1);
    expect(result.filename).toMatch(/^lumina-casts-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(result.csv).toContain("user_id,cast_id,email");
    expect(result.csv).toContain('"みな, A"');
    expect(result.csv).toContain("錦 / 栄");
  });
});

describe("adminPanel.users.softDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("ユーザーを deletedAt でソフトデリートする", async () => {
    userFindFirst.mockResolvedValue({ id: "u-1", role: "CAST" });
    userUpdate.mockResolvedValue({ id: "u-1", deletedAt: new Date() });

    const caller = await createCaller();
    const result = await caller.adminPanel.users.softDelete({ userId: "u-1" });

    expect(result.success).toBe(true);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u-1" },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it("管理者ユーザーは削除しない", async () => {
    userFindFirst.mockResolvedValue({ id: "u-admin", role: "ADMIN" });

    const caller = await createCaller();
    await expect(
      caller.adminPanel.users.softDelete({ userId: "u-admin" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
