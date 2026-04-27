import { describe, it, expect, beforeEach, vi } from "vitest";

const castFindManyMock = vi.fn();
const ownerFindUniqueMock = vi.fn();
const storeFindFirstMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findMany: (...args: unknown[]) => castFindManyMock(...args),
    },
    owner: {
      findUnique: (...args: unknown[]) => ownerFindUniqueMock(...args),
    },
    store: {
      findFirst: (...args: unknown[]) => storeFindFirstMock(...args),
    },
  },
}));

vi.mock("@/server/notifications", () => ({
  dispatchNotification: vi.fn(),
}));

async function createOwnerCaller() {
  const { createInnerTRPCContext } = await import("@/server/api/trpc");
  const { appRouter } = await import("@/server/api/root");
  const ctx = createInnerTRPCContext({
    session: {
      user: { id: "owner-user-1", role: "OWNER" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  return appRouter.createCaller(ctx);
}

describe("store.searchCasts - 未完成プロフィールの除外", () => {
  beforeEach(() => {
    castFindManyMock.mockReset();
    ownerFindUniqueMock.mockReset();
    storeFindFirstMock.mockReset();

    ownerFindUniqueMock.mockResolvedValue({ id: "owner-1" });
    storeFindFirstMock.mockResolvedValue({ id: "store-1", ownerId: "owner-1" });
    castFindManyMock.mockResolvedValue([]);
  });

  it("where に nickname 非空 / age 非 null の条件が含まれる", async () => {
    const caller = await createOwnerCaller();
    await caller.store.searchCasts({ storeId: "store-1", limit: 20 });

    expect(castFindManyMock).toHaveBeenCalledTimes(1);
    const args = castFindManyMock.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(args.where).toMatchObject({
      nickname: { not: "" },
      age: { not: null },
    });
  });

  it("minAge/maxAge 指定時も age 非 null の条件は維持される", async () => {
    const caller = await createOwnerCaller();
    await caller.store.searchCasts({
      storeId: "store-1",
      minAge: 20,
      maxAge: 35,
      limit: 20,
    });

    const args = castFindManyMock.mock.calls[0][0] as {
      where: { age: Record<string, unknown> };
    };
    // age に gte / lte と not: null が共存する
    expect(args.where.age).toMatchObject({
      gte: 20,
      lte: 35,
      not: null,
    });
  });
});
