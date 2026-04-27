import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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

const validInput = {
  nickname: "テスト",
  age: 25,
  description: "test",
};

describe("cast.upsertProfile 認可", () => {
  it("OWNER role は cast.upsertProfile を呼べず FORBIDDEN", async () => {
    const caller = await createCallerForRole("OWNER");
    await expect(caller.cast.upsertProfile(validInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN role は cast.upsertProfile を呼べず FORBIDDEN", async () => {
    const caller = await createCallerForRole("ADMIN");
    await expect(caller.cast.upsertProfile(validInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("未認証は cast.upsertProfile を呼べず UNAUTHORIZED", async () => {
    const caller = await createCallerForRole(null);
    await expect(caller.cast.upsertProfile(validInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
