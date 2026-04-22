import { describe, it, expect, beforeEach, vi } from "vitest";

const findManyMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    store: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

vi.mock("@/server/notifications", () => ({
  dispatchNotification: vi.fn(),
}));

async function createCastCaller() {
  const { createInnerTRPCContext } = await import("@/server/api/trpc");
  const { appRouter } = await import("@/server/api/root");
  const ctx = createInnerTRPCContext({
    session: {
      user: { id: "cast-user-1", role: "CAST" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  return appRouter.createCaller(ctx);
}

describe("cast.searchStores - atmosphereTags フィルタ", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    findManyMock.mockResolvedValue([]);
  });

  it("atmosphereTags を input に渡すと where に hasSome が付与される", async () => {
    const caller = await createCastCaller();
    await caller.cast.searchStores({
      atmosphereTags: ["落ち着いた", "高級感"],
      limit: 10,
    });

    expect(findManyMock).toHaveBeenCalledTimes(1);
    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      isVerified: true,
      atmosphereTags: { hasSome: ["落ち着いた", "高級感"] },
    });
  });

  it("atmosphereTags が未指定なら where に atmosphereTags は含まれない", async () => {
    const caller = await createCastCaller();
    await caller.cast.searchStores({ limit: 10 });

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).not.toHaveProperty("atmosphereTags");
  });

  it("atmosphereTags が空配列なら where に atmosphereTags は含まれない", async () => {
    const caller = await createCastCaller();
    await caller.cast.searchStores({ atmosphereTags: [], limit: 10 });

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).not.toHaveProperty("atmosphereTags");
  });

  it("既存の benefit / area フィルタと併用できる", async () => {
    const caller = await createCastCaller();
    await caller.cast.searchStores({
      area: "新宿",
      benefit: "日払いOK",
      atmosphereTags: ["明るい"],
      limit: 5,
    });

    const args = findManyMock.mock.calls[0][0];
    expect(args.where).toMatchObject({
      area: { contains: "新宿" },
      benefits: { has: "日払いOK" },
      atmosphereTags: { hasSome: ["明るい"] },
    });
  });
});

describe("cast.listAtmosphereTags", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findManyMock.mockResolvedValue([]);
  });

  it("全店舗の atmosphereTags を取得して出現頻度上位 20 件を返す", async () => {
    findManyMock.mockResolvedValue([
      { atmosphereTags: ["落ち着いた", "高級感"] },
      { atmosphereTags: ["落ち着いた", "明るい"] },
      { atmosphereTags: ["高級感"] },
      { atmosphereTags: [] },
      { atmosphereTags: null },
    ]);

    const caller = await createCastCaller();
    const result = await caller.cast.listAtmosphereTags();

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(findManyMock.mock.calls[0][0]).toMatchObject({
      where: { isVerified: true },
      select: { atmosphereTags: true },
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result[0]).toBe("落ち着いた");
    expect(result).toContain("高級感");
    expect(result).toContain("明るい");
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });
});
