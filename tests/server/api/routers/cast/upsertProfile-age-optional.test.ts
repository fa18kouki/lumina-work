import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const castUpsertMock = vi.fn();
const castUpdateMock = vi.fn();
const castWorkHistoryFindManyMock = vi.fn();
const accountFindFirstMock = vi.fn();
const userUpdateMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      upsert: (...args: unknown[]) => castUpsertMock(...args),
      update: (...args: unknown[]) => castUpdateMock(...args),
    },
    castWorkHistory: {
      findMany: (...args: unknown[]) => castWorkHistoryFindManyMock(...args),
    },
    account: {
      findFirst: (...args: unknown[]) => accountFindFirstMock(...args),
    },
    user: {
      update: (...args: unknown[]) => userUpdateMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
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

describe("cast.upsertProfile - age optional / nickname required", () => {
  beforeEach(() => {
    castUpsertMock.mockReset();
    castUpdateMock.mockReset();
    castWorkHistoryFindManyMock.mockReset();
    accountFindFirstMock.mockReset();
    userUpdateMock.mockReset();
    transactionMock.mockReset();

    castUpsertMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user-1",
      nickname: "さくら",
      age: null,
      lineUserId: null,
    });
    castUpdateMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user-1",
      nickname: "さくら",
      age: null,
      lineUserId: null,
    });
    castWorkHistoryFindManyMock.mockResolvedValue([]);
    accountFindFirstMock.mockResolvedValue(null);
    userUpdateMock.mockResolvedValue({ id: "cast-user-1", role: "CAST" });
    transactionMock.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          castExperience: { deleteMany: vi.fn(), createMany: vi.fn() },
          castWorkHistory: { deleteMany: vi.fn(), createMany: vi.fn() },
        })
    );
  });

  it("age を渡さなくても upsertProfile が通り、DB には age=null で書き込まれる", async () => {
    const caller = await createCastCaller();
    await caller.cast.upsertProfile({
      nickname: "さくら",
      // age を省略
    });

    expect(castUpsertMock).toHaveBeenCalledTimes(1);
    const args = castUpsertMock.mock.calls[0][0] as {
      update: { age: number | null };
      create: { age: number | null };
    };
    expect(args.update.age).toBeNull();
    expect(args.create.age).toBeNull();
  });

  it("nickname を空文字で送ると zod エラーで rejected される", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.upsertProfile({
        nickname: "",
        age: 25,
      })
    ).rejects.toBeInstanceOf(TRPCError);
    expect(castUpsertMock).not.toHaveBeenCalled();
  });
});
