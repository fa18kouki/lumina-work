import { describe, it, expect, beforeEach, vi } from "vitest";

const castFindUniqueMock = vi.fn();
const castCreateMock = vi.fn();
const userUpdateMock = vi.fn();
const diagnosisSessionCreateMock = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findUnique: (...args: unknown[]) => castFindUniqueMock(...args),
      create: (...args: unknown[]) => castCreateMock(...args),
    },
    user: {
      update: (...args: unknown[]) => userUpdateMock(...args),
    },
    diagnosisSession: {
      create: (...args: unknown[]) => diagnosisSessionCreateMock(...args),
    },
  },
}));

vi.mock("@/server/notifications", () => ({
  dispatchNotification: vi.fn(),
}));

async function createDiagnosisCaller() {
  const { createInnerTRPCContext } = await import("@/server/api/trpc");
  const { appRouter } = await import("@/server/api/root");
  const ctx = createInnerTRPCContext({
    session: {
      user: { id: "user-1", role: "CAST" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  return appRouter.createCaller(ctx);
}

describe("diagnosis.startSession - 新規 Cast 作成時のダミー値禁止", () => {
  beforeEach(() => {
    castFindUniqueMock.mockReset();
    castCreateMock.mockReset();
    userUpdateMock.mockReset();
    diagnosisSessionCreateMock.mockReset();
    castCreateMock.mockResolvedValue({ id: "cast-new", userId: "user-1" });
    userUpdateMock.mockResolvedValue({ id: "user-1", role: "CAST" });
    diagnosisSessionCreateMock.mockResolvedValue({
      id: "session-1",
      castId: "cast-new",
      currentStep: "BASIC_INFO",
      answers: {},
    });
  });

  it("Cast が存在しないユーザーで startSession を呼ぶと、ダミー age=18 を入れずに Cast を作る", async () => {
    castFindUniqueMock.mockResolvedValueOnce(null);

    const caller = await createDiagnosisCaller();
    await caller.diagnosis.startSession();

    expect(castCreateMock).toHaveBeenCalledTimes(1);
    const callArgs = castCreateMock.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(callArgs.data.userId).toBe("user-1");
    expect(callArgs.data.nickname).toBe("");
    expect(callArgs.data.age).toBeUndefined();
    expect(callArgs.data.photos).toEqual([]);
    expect(callArgs.data.desiredAreas).toEqual([]);
  });
});
