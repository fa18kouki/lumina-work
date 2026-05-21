import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

const userFindMany = vi.fn();
const userFindFirst = vi.fn();
const subscriptionUpsert = vi.fn();
const planConfigFindUnique = vi.fn();
const ownerFindUnique = vi.fn();

const prismaMock = {
  user: {
    findMany: (...args: unknown[]) => userFindMany(...args),
    findFirst: (...args: unknown[]) => userFindFirst(...args),
  },
  owner: {
    findUnique: (...args: unknown[]) => ownerFindUnique(...args),
  },
  subscription: {
    upsert: (...args: unknown[]) => subscriptionUpsert(...args),
  },
  subscriptionPlanConfig: {
    findUnique: (...args: unknown[]) => planConfigFindUnique(...args),
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

describe("adminPanel.subscriptions — 認可", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
  });

  it("admin-session cookie 無しで list は UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(
      caller.adminPanel.subscriptions.list({}),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("admin-session cookie 無しで changePlan は UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(
      caller.adminPanel.subscriptions.changePlan({
        userId: "u-1",
        plan: "PRO_TRIAL",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(subscriptionUpsert).not.toHaveBeenCalled();
  });
});

describe("adminPanel.subscriptions.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("OWNER だけを返し、退会済みは除外、subscription を include する", async () => {
    userFindMany.mockResolvedValue([
      {
        id: "u-1",
        email: "alice@example.com",
        createdAt: new Date(),
        owner: {
          id: "o-1",
          companyName: "Alice Co",
          subscription: {
            plan: "FREE",
            status: "ACTIVE",
            offerLimit: 3,
            maxStores: 1,
          },
        },
      },
    ]);

    const caller = await createCaller();
    const result = await caller.adminPanel.subscriptions.list({});

    const call = userFindMany.mock.calls[0]?.[0];
    expect(call.where).toMatchObject({ role: "OWNER", deletedAt: null });
    expect(call.include.owner.include.subscription).toBe(true);
    expect(result.users[0]).toMatchObject({
      id: "u-1",
      owner: { subscription: { plan: "FREE" } },
    });
  });

  it("search が指定されれば email / 会社名で OR 検索", async () => {
    userFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.subscriptions.list({ search: "alice" });

    const where = userFindMany.mock.calls[0]?.[0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { email: { contains: "alice", mode: "insensitive" } },
      ]),
    );
  });

  it("nextCursor は limit を超えた場合のみ付く", async () => {
    const rows = Array.from({ length: 6 }).map((_, i) => ({
      id: `u-${i}`,
      email: `u${i}@example.com`,
      owner: { id: `o-${i}`, companyName: null, subscription: null },
      createdAt: new Date(),
    }));
    userFindMany.mockResolvedValue(rows);

    const caller = await createCaller();
    const result = await caller.adminPanel.subscriptions.list({ limit: 5 });

    expect(result.users).toHaveLength(5);
    expect(result.nextCursor).toBe("u-5");
  });
});

describe("adminPanel.subscriptions.changePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
    // user は OWNER で active がデフォルト
    userFindFirst.mockResolvedValue({
      id: "u-1",
      role: "OWNER",
      deletedAt: null,
      owner: { id: "o-1" },
    });
    planConfigFindUnique.mockResolvedValue({
      id: "cfg-pro-trial",
      plan: "PRO_TRIAL",
      offerLimit: null,
      maxStores: null,
    });
    subscriptionUpsert.mockResolvedValue({
      id: "sub-1",
      plan: "PRO_TRIAL",
      status: "ACTIVE",
    });
  });

  it("OWNER ユーザーのプランを更新し、新しい Subscription を返す", async () => {
    const caller = await createCaller();
    const result = await caller.adminPanel.subscriptions.changePlan({
      userId: "u-1",
      plan: "PRO_TRIAL",
    });

    expect(subscriptionUpsert).toHaveBeenCalledOnce();
    const call = subscriptionUpsert.mock.calls[0]?.[0];
    expect(call.where).toEqual({ ownerId: "o-1" });
    expect(call.update.plan).toBe("PRO_TRIAL");
    expect(call.update.planConfigId).toBe("cfg-pro-trial");
    expect(call.create.ownerId).toBe("o-1");
    expect(call.create.plan).toBe("PRO_TRIAL");
    expect(result.plan).toBe("PRO_TRIAL");
  });

  it("ユーザーが OWNER 以外なら BAD_REQUEST", async () => {
    userFindFirst.mockResolvedValue({
      id: "u-cast",
      role: "CAST",
      deletedAt: null,
      owner: null,
    });

    const caller = await createCaller();
    await expect(
      caller.adminPanel.subscriptions.changePlan({
        userId: "u-cast",
        plan: "PRO_TRIAL",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(subscriptionUpsert).not.toHaveBeenCalled();
  });

  it("ユーザーが見つからない / 退会済みなら NOT_FOUND", async () => {
    userFindFirst.mockResolvedValue(null);

    const caller = await createCaller();
    await expect(
      caller.adminPanel.subscriptions.changePlan({
        userId: "u-missing",
        plan: "FREE",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("Owner レコードが無いオーナー (data 不整合) は BAD_REQUEST", async () => {
    userFindFirst.mockResolvedValue({
      id: "u-1",
      role: "OWNER",
      deletedAt: null,
      owner: null,
    });

    const caller = await createCaller();
    await expect(
      caller.adminPanel.subscriptions.changePlan({
        userId: "u-1",
        plan: "PRO_TRIAL",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("PlanConfig が DB に無くても update は成功 (planConfigId=null)", async () => {
    planConfigFindUnique.mockResolvedValue(null);
    subscriptionUpsert.mockResolvedValue({
      id: "sub-1",
      plan: "PRO_TRIAL",
      status: "ACTIVE",
    });

    const caller = await createCaller();
    await caller.adminPanel.subscriptions.changePlan({
      userId: "u-1",
      plan: "PRO_TRIAL",
    });

    const call = subscriptionUpsert.mock.calls[0]?.[0];
    expect(call.update.planConfigId).toBeNull();
    expect(call.create.planConfigId).toBeNull();
  });

  it("status を上書きできる (PAST_DUE で凍結する等)", async () => {
    const caller = await createCaller();
    await caller.adminPanel.subscriptions.changePlan({
      userId: "u-1",
      plan: "PRO_TRIAL",
      status: "PAST_DUE",
    });

    const call = subscriptionUpsert.mock.calls[0]?.[0];
    expect(call.update.status).toBe("PAST_DUE");
    expect(call.create.status).toBe("PAST_DUE");
  });
});
