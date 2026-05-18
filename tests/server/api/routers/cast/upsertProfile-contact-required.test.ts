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

const CONTACT_REQUIRED_MESSAGE =
  "電話番号・SNS・メールアドレスのいずれか1つ以上の入力が必要です";

describe("cast.upsertProfile - 連絡先必須化 (電話/SNS/メール のいずれか1つ以上)", () => {
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
    });
    castUpdateMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user-1",
      nickname: "さくら",
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

  it("電話・SNS・メール全て未入力なら BAD_REQUEST で rejected される", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.upsertProfile({
        nickname: "さくら",
        phoneNumber: "",
        email: "",
        pcEmail: "",
        instagramId: "",
        lineId: "",
        twitterId: "",
        tiktokId: "",
        facebookId: "",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(castUpsertMock).not.toHaveBeenCalled();
  });

  it("どのフィールドも全く渡さない場合も BAD_REQUEST で rejected される", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.upsertProfile({
        nickname: "さくら",
      })
    ).rejects.toBeInstanceOf(TRPCError);
    expect(castUpsertMock).not.toHaveBeenCalled();
  });

  it("エラー文言は『電話番号・SNS・メールアドレスのいずれか1つ以上の入力が必要です』を含む", async () => {
    const caller = await createCastCaller();
    try {
      await caller.cast.upsertProfile({ nickname: "さくら" });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      const message = (err as TRPCError).message;
      expect(message).toContain(CONTACT_REQUIRED_MESSAGE);
    }
  });

  it("phoneNumber のみ入力されていれば通る", async () => {
    const caller = await createCastCaller();
    await caller.cast.upsertProfile({
      nickname: "さくら",
      phoneNumber: "09012345678",
    });
    expect(castUpsertMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["instagramId", "sakura_insta"],
    ["lineId", "sakura_line"],
    ["twitterId", "sakura_twitter"],
    ["tiktokId", "sakura_tiktok"],
    ["facebookId", "sakura_fb"],
  ] as const)("SNS フィールド %s のみ入力でも通る", async (field, value) => {
    const caller = await createCastCaller();
    await caller.cast.upsertProfile({
      nickname: "さくら",
      [field]: value,
    });
    expect(castUpsertMock).toHaveBeenCalledTimes(1);
  });

  it("email のみ入力されていれば通る", async () => {
    const caller = await createCastCaller();
    await caller.cast.upsertProfile({
      nickname: "さくら",
      email: "sakura@example.com",
    });
    expect(castUpsertMock).toHaveBeenCalledTimes(1);
  });

  it("pcEmail のみ入力されていれば通る", async () => {
    const caller = await createCastCaller();
    await caller.cast.upsertProfile({
      nickname: "さくら",
      pcEmail: "sakura.pc@example.com",
    });
    expect(castUpsertMock).toHaveBeenCalledTimes(1);
  });
});
