import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    diagnosisSession: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/notifications", () => ({
  dispatchNotification: vi.fn(),
}));

async function createCallerForRole(role: "OWNER" | "ADMIN" | "CAST" | null) {
  const { createInnerTRPCContext } = await import("@/server/api/trpc");
  const { appRouter } = await import("@/server/api/root");
  const ctx = createInnerTRPCContext({
    session: role
      ? {
          user: { id: "user-x", role },
          expires: new Date(Date.now() + 60_000).toISOString(),
        }
      : null,
  });
  return appRouter.createCaller(ctx);
}

describe("diagnosis.startSession 認可", () => {
  it("OWNER role は startSession を呼べず FORBIDDEN (role エスカレーション防止)", async () => {
    const caller = await createCallerForRole("OWNER");
    await expect(caller.diagnosis.startSession()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN role は startSession を呼べず FORBIDDEN", async () => {
    const caller = await createCallerForRole("ADMIN");
    await expect(caller.diagnosis.startSession()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("未認証は startSession を呼べず UNAUTHORIZED", async () => {
    const caller = await createCallerForRole(null);
    await expect(caller.diagnosis.startSession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
