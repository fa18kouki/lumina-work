import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

const storeFindMany = vi.fn();

const prismaMock = {
  store: {
    findMany: (...args: unknown[]) => storeFindMany(...args),
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

describe("adminPanel.stores.list — 認可", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
  });

  it("admin-session cookie が無いと UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(caller.adminPanel.stores.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(storeFindMany).not.toHaveBeenCalled();
  });
});

describe("adminPanel.stores.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("deletedAt: null を where に常に付与する (削除済み店舗の除外)", async () => {
    storeFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.stores.list({});
    expect(storeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it("isVerified=false を区別して where に流す (undefined と区別)", async () => {
    storeFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.stores.list({ isVerified: false });
    const call = storeFindMany.mock.calls[0]?.[0];
    expect(call.where.isVerified).toBe(false);
  });

  it("search は名前の大文字小文字無視 contains 検索になる", async () => {
    storeFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.stores.list({ search: "Lounge" });
    const call = storeFindMany.mock.calls[0]?.[0];
    expect(call.where.name).toEqual({
      contains: "Lounge",
      mode: "insensitive",
    });
  });

  it("limit + 1 件返ったら nextCursor を返す", async () => {
    const rows = Array.from({ length: 6 }).map((_, i) => ({
      id: `s-${i}`,
      name: `Store ${i}`,
      area: "六本木",
      isVerified: false,
      owner: { user: { email: null }, companyName: null },
      _count: { matches: 0, offers: 0, interviews: 0 },
      createdAt: new Date(),
    }));
    storeFindMany.mockResolvedValue(rows);
    const caller = await createCaller();
    const result = await caller.adminPanel.stores.list({ limit: 5 });
    expect(result.stores).toHaveLength(5);
    expect(result.nextCursor).toBe("s-5");
  });
});
