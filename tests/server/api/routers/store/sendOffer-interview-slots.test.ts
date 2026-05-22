import { describe, it, expect, beforeEach, vi } from "vitest";

const ownerFindUniqueMock = vi.fn();
const storeFindFirstMock = vi.fn();
const subscriptionFindUniqueMock = vi.fn();
const offerCountMock = vi.fn();
const offerFindFirstMock = vi.fn();
const offerCreateMock = vi.fn();
const castFindUniqueMock = vi.fn();
const castStoreBlockFindUniqueMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    owner: { findUnique: (...a: unknown[]) => ownerFindUniqueMock(...a) },
    store: { findFirst: (...a: unknown[]) => storeFindFirstMock(...a) },
    subscription: {
      findUnique: (...a: unknown[]) => subscriptionFindUniqueMock(...a),
    },
    offer: {
      count: (...a: unknown[]) => offerCountMock(...a),
      findFirst: (...a: unknown[]) => offerFindFirstMock(...a),
      create: (...a: unknown[]) => offerCreateMock(...a),
    },
    cast: { findUnique: (...a: unknown[]) => castFindUniqueMock(...a) },
    castStoreBlock: {
      findUnique: (...a: unknown[]) => castStoreBlockFindUniqueMock(...a),
    },
  },
}));

vi.mock("@/server/notifications", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
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

function futureIso(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

const validInputBase = {
  storeId: "store-1",
  castId: "cast-1",
  message: "ぜひ面接にお越しください",
  expiresInDays: 7,
};

describe("store.sendOffer - 面接候補日時 (interviewSlots)", () => {
  beforeEach(() => {
    ownerFindUniqueMock.mockReset();
    storeFindFirstMock.mockReset();
    subscriptionFindUniqueMock.mockReset();
    offerCountMock.mockReset();
    offerFindFirstMock.mockReset();
    offerCreateMock.mockReset();
    castFindUniqueMock.mockReset();
    castStoreBlockFindUniqueMock.mockReset();

    ownerFindUniqueMock.mockResolvedValue({ id: "owner-1" });
    storeFindFirstMock.mockResolvedValue({
      id: "store-1",
      ownerId: "owner-1",
      name: "店舗A",
      area: "栄",
    });
    subscriptionFindUniqueMock.mockResolvedValue({
      ownerId: "owner-1",
      offerLimit: 999,
      trialEndsAt: null,
    });
    offerCountMock.mockResolvedValue(0);
    offerFindFirstMock.mockResolvedValue(null);
    castFindUniqueMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user-1",
      lineUserId: null,
      user: { email: "c@example.com" },
    });
    castStoreBlockFindUniqueMock.mockResolvedValue(null);
    offerCreateMock.mockResolvedValue({ id: "offer-1" });
  });

  it("interviewSlots が無いと zod エラーになる", async () => {
    const caller = await createOwnerCaller();
    await expect(
      // @ts-expect-error - interviewSlots が無いケースを意図的に
      caller.store.sendOffer(validInputBase),
    ).rejects.toBeDefined();
    expect(offerCreateMock).not.toHaveBeenCalled();
  });

  it("interviewSlots が 2 件しか無いと zod エラーになる", async () => {
    const caller = await createOwnerCaller();
    await expect(
      caller.store.sendOffer({
        ...validInputBase,
        interviewSlots: [futureIso(1), futureIso(2)],
      }),
    ).rejects.toBeDefined();
    expect(offerCreateMock).not.toHaveBeenCalled();
  });

  it("interviewSlots が 4 件あると zod エラーになる", async () => {
    const caller = await createOwnerCaller();
    await expect(
      caller.store.sendOffer({
        ...validInputBase,
        interviewSlots: [
          futureIso(1),
          futureIso(2),
          futureIso(3),
          futureIso(4),
        ],
      }),
    ).rejects.toBeDefined();
    expect(offerCreateMock).not.toHaveBeenCalled();
  });

  it("interviewSlots が 3 件あれば Offer.create に Date[] として渡される", async () => {
    const caller = await createOwnerCaller();
    const slots = [futureIso(1), futureIso(2), futureIso(3)];
    await caller.store.sendOffer({
      ...validInputBase,
      interviewSlots: slots,
    });

    expect(offerCreateMock).toHaveBeenCalledTimes(1);
    const args = offerCreateMock.mock.calls[0][0] as {
      data: { interviewSlots: Date[] };
    };
    expect(args.data.interviewSlots).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(args.data.interviewSlots[i]).toBeInstanceOf(Date);
      expect(args.data.interviewSlots[i].toISOString()).toBe(slots[i]);
    }
  });

  it("過去日時の slot は zod エラーになる", async () => {
    const caller = await createOwnerCaller();
    await expect(
      caller.store.sendOffer({
        ...validInputBase,
        interviewSlots: [
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          futureIso(2),
          futureIso(3),
        ],
      }),
    ).rejects.toBeDefined();
    expect(offerCreateMock).not.toHaveBeenCalled();
  });

  it("interviewSlots に重複した日時が含まれると zod エラーになる", async () => {
    const caller = await createOwnerCaller();
    const dup = futureIso(2);
    await expect(
      caller.store.sendOffer({
        ...validInputBase,
        interviewSlots: [futureIso(1), dup, dup],
      }),
    ).rejects.toBeDefined();
    expect(offerCreateMock).not.toHaveBeenCalled();
  });
});
