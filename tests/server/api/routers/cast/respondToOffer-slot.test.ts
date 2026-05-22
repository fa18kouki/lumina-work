import { describe, it, expect, beforeEach, vi } from "vitest";

const castFindUniqueMock = vi.fn();
const offerFindUniqueMock = vi.fn();
const offerUpdateMock = vi.fn();
const matchCreateMock = vi.fn();
const interviewCreateMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    cast: { findUnique: (...a: unknown[]) => castFindUniqueMock(...a) },
    offer: {
      findUnique: (...a: unknown[]) => offerFindUniqueMock(...a),
      update: (...a: unknown[]) => offerUpdateMock(...a),
    },
    match: { create: (...a: unknown[]) => matchCreateMock(...a) },
    interview: { create: (...a: unknown[]) => interviewCreateMock(...a) },
    $transaction: (...a: unknown[]) => transactionMock(...a),
  },
}));

const dispatchMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/server/notifications", () => ({
  dispatchNotification: (...a: unknown[]) => dispatchMock(...a),
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

function futureDate(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

const slots = [futureDate(1), futureDate(2), futureDate(3)];

describe("cast.respondToOffer - 面接候補 (slot) 選択", () => {
  beforeEach(() => {
    castFindUniqueMock.mockReset();
    offerFindUniqueMock.mockReset();
    offerUpdateMock.mockReset();
    matchCreateMock.mockReset();
    interviewCreateMock.mockReset();
    transactionMock.mockReset();
    dispatchMock.mockClear();

    castFindUniqueMock.mockResolvedValue({
      id: "cast-1",
      nickname: "あい",
      lineId: null,
      user: { email: "c@example.com", phone: null },
    });

    offerFindUniqueMock.mockResolvedValue({
      id: "offer-1",
      castId: "cast-1",
      storeId: "store-1",
      status: "PENDING",
      interviewSlots: slots,
      store: {
        id: "store-1",
        name: "店舗A",
        owner: {
          userId: "owner-user-1",
          user: { email: "o@example.com" },
        },
      },
      cast: {
        id: "cast-1",
        userId: "cast-user-1",
      },
    });

    offerUpdateMock.mockImplementation(async ({ data }) => ({
      id: "offer-1",
      storeId: "store-1",
      status: data.status,
      store: {
        owner: {
          userId: "owner-user-1",
          user: { email: "o@example.com" },
        },
      },
    }));
    matchCreateMock.mockResolvedValue({ id: "match-1" });
    interviewCreateMock.mockImplementation(async ({ data }) => ({
      id: "interview-1",
      ...data,
    }));

    // $transaction(callback) 形式: callback(prisma) を実行
    // $transaction(array) 形式: Promise.all 同等
    transactionMock.mockImplementation(async (arg: unknown) => {
      if (typeof arg === "function") {
        const txPrisma = {
          offer: { update: offerUpdateMock },
          match: { create: matchCreateMock },
          interview: { create: interviewCreateMock },
        };
        return (arg as (p: typeof txPrisma) => unknown)(txPrisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      throw new Error("unexpected $transaction arg");
    });
  });

  it("承諾時に selectedSlotIndex を渡さないと BAD_REQUEST", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.respondToOffer({ offerId: "offer-1", accept: true }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(offerUpdateMock).not.toHaveBeenCalled();
    expect(interviewCreateMock).not.toHaveBeenCalled();
  });

  it("承諾時に selectedSlotIndex が範囲外 (-1) だと BAD_REQUEST", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.respondToOffer({
        offerId: "offer-1",
        accept: true,
        // @ts-expect-error - 範囲外
        selectedSlotIndex: -1,
      }),
    ).rejects.toBeDefined();
  });

  it("承諾時に selectedSlotIndex=3 (範囲外、3件中) だと BAD_REQUEST", async () => {
    const caller = await createCastCaller();
    await expect(
      caller.cast.respondToOffer({
        offerId: "offer-1",
        accept: true,
        selectedSlotIndex: 3,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("承諾時に Offer 更新 + Match 作成 + Interview SCHEDULED 作成が呼ばれる", async () => {
    const caller = await createCastCaller();
    await caller.cast.respondToOffer({
      offerId: "offer-1",
      accept: true,
      selectedSlotIndex: 1,
    });

    expect(offerUpdateMock).toHaveBeenCalledTimes(1);
    expect(offerUpdateMock.mock.calls[0][0]).toMatchObject({
      where: { id: "offer-1", castId: "cast-1" },
      data: { status: "ACCEPTED" },
    });

    expect(matchCreateMock).toHaveBeenCalledTimes(1);
    expect(matchCreateMock.mock.calls[0][0]).toMatchObject({
      data: {
        castId: "cast-1",
        storeId: "store-1",
        status: "ACCEPTED",
      },
    });

    expect(interviewCreateMock).toHaveBeenCalledTimes(1);
    const interviewArgs = interviewCreateMock.mock.calls[0][0] as {
      data: {
        offerId: string;
        castId: string;
        storeId: string;
        scheduledAt: Date;
      };
    };
    expect(interviewArgs.data.offerId).toBe("offer-1");
    expect(interviewArgs.data.castId).toBe("cast-1");
    expect(interviewArgs.data.storeId).toBe("store-1");
    expect(interviewArgs.data.scheduledAt.toISOString()).toBe(
      slots[1].toISOString(),
    );
  });

  it("辞退時は selectedSlotIndex 不要、Match / Interview は作成されない", async () => {
    const caller = await createCastCaller();
    await caller.cast.respondToOffer({
      offerId: "offer-1",
      accept: false,
    });

    expect(offerUpdateMock).toHaveBeenCalledTimes(1);
    expect(offerUpdateMock.mock.calls[0][0]).toMatchObject({
      data: { status: "REJECTED" },
    });
    expect(matchCreateMock).not.toHaveBeenCalled();
    expect(interviewCreateMock).not.toHaveBeenCalled();
  });

  it("interviewSlots が空 (旧データ) の Offer を承諾しようとすると BAD_REQUEST", async () => {
    offerFindUniqueMock.mockResolvedValueOnce({
      id: "offer-1",
      castId: "cast-1",
      storeId: "store-1",
      status: "PENDING",
      interviewSlots: [],
      store: {
        id: "store-1",
        name: "店舗A",
        owner: {
          userId: "owner-user-1",
          user: { email: "o@example.com" },
        },
      },
    });

    const caller = await createCastCaller();
    await expect(
      caller.cast.respondToOffer({
        offerId: "offer-1",
        accept: true,
        selectedSlotIndex: 0,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(offerUpdateMock).not.toHaveBeenCalled();
    expect(interviewCreateMock).not.toHaveBeenCalled();
  });
});
