import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

const userFindMany = vi.fn();
const userFindFirst = vi.fn();

const prismaMock = {
  user: {
    findMany: (...args: unknown[]) => userFindMany(...args),
    findFirst: (...args: unknown[]) => userFindFirst(...args),
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
