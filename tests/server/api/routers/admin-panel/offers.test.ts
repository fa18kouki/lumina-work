import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
} from "@/lib/admin-auth";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaa";

const offerFindMany = vi.fn();
const offerGroupBy = vi.fn();
const offerFindUnique = vi.fn();
const interviewGroupBy = vi.fn();
const matchFindFirst = vi.fn();

const prismaMock = {
  offer: {
    findMany: (...args: unknown[]) => offerFindMany(...args),
    groupBy: (...args: unknown[]) => offerGroupBy(...args),
    findUnique: (...args: unknown[]) => offerFindUnique(...args),
  },
  interview: {
    groupBy: (...args: unknown[]) => interviewGroupBy(...args),
  },
  match: {
    findFirst: (...args: unknown[]) => matchFindFirst(...args),
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

describe("adminPanel.offers — 認可", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
  });

  it("cookie 無しで list は UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(caller.adminPanel.offers.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("cookie 無しで funnel も UNAUTHORIZED", async () => {
    clearCookie();
    const caller = await createCaller();
    await expect(caller.adminPanel.offers.funnel()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("adminPanel.offers.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("status / castId / storeId / date を Prisma の where に流す", async () => {
    offerFindMany.mockResolvedValue([]);
    const caller = await createCaller();
    await caller.adminPanel.offers.list({
      status: "PENDING",
      castId: "c1",
      storeId: "s1",
      dateFrom: "2026-04-01T00:00:00.000Z",
      dateTo: "2026-05-01T00:00:00.000Z",
    });
    const call = offerFindMany.mock.calls[0]?.[0];
    expect(call.where.status).toBe("PENDING");
    expect(call.where.castId).toBe("c1");
    expect(call.where.storeId).toBe("s1");
    expect(call.where.createdAt.gte).toBeInstanceOf(Date);
    expect(call.where.createdAt.lte).toBeInstanceOf(Date);
  });

  it("limit より多い結果から nextCursor を計算する", async () => {
    const rows = Array.from({ length: 21 }).map((_, i) => ({
      id: `o-${i}`,
      status: "PENDING",
      cast: { user: { email: null } },
      store: { name: "Store" },
      interviews: [],
      createdAt: new Date(),
      expiresAt: new Date(),
    }));
    offerFindMany.mockResolvedValue(rows);
    const caller = await createCaller();
    const result = await caller.adminPanel.offers.list({ limit: 20 });
    expect(result.offers).toHaveLength(20);
    expect(result.nextCursor).toBe("o-20");
  });
});

describe("adminPanel.offers.funnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = SECRET;
    loginWithValidCookie();
  });

  it("欠落 status は 0 で穴埋めし、全 4 件揃えて返す", async () => {
    offerGroupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 5 } },
      { status: "ACCEPTED", _count: { _all: 3 } },
      // REJECTED, EXPIRED は意図的に欠落させる
    ]);
    interviewGroupBy.mockResolvedValue([
      { status: "SCHEDULED", _count: { _all: 2 } },
      { status: "COMPLETED", _count: { _all: 1 } },
    ]);
    const caller = await createCaller();
    const result = await caller.adminPanel.offers.funnel();
    expect(result.offerTotal).toBe(8);
    expect(result.offers).toEqual({
      PENDING: 5,
      ACCEPTED: 3,
      REJECTED: 0,
      EXPIRED: 0,
    });
    expect(result.interviews).toEqual({
      SCHEDULED: 2,
      COMPLETED: 1,
      NO_SHOW: 0,
      CANCELLED: 0,
    });
    expect(result.interviewTotal).toBe(3);
  });
});
