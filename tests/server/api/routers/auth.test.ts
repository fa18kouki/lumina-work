import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- Prisma mocks
const adminInvitationFindUnique = vi.fn();
const userFindFirst = vi.fn();

const prismaMock = {
  adminInvitation: {
    findUnique: (...args: unknown[]) => adminInvitationFindUnique(...args),
  },
  user: {
    findFirst: (...args: unknown[]) => userFindFirst(...args),
  },
};

vi.mock("@/server/db", () => ({
  prisma: prismaMock,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
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

describe("auth.preflightOwnerSignup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminInvitationFindUnique.mockResolvedValue(null);
    userFindFirst.mockResolvedValue(null);
  });

  it("どこにも email が無ければ ok: true を返す", async () => {
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "fresh@example.com",
    });
    expect(result).toEqual({ ok: true });
  });

  it("PENDING な AdminInvitation が存在する email は PENDING_INVITATION", async () => {
    adminInvitationFindUnique.mockResolvedValue({ status: "PENDING" });
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "invited@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "PENDING_INVITATION" });
    // PENDING は signUp 不可なので、user テーブルは引かなくても良いが、
    // 実装が引いても害は無い。重要なのは結果が PENDING_INVITATION であること。
  });

  it("REVOKED な AdminInvitation は ok 扱い (招待は失効済みなので self-register 可)", async () => {
    adminInvitationFindUnique.mockResolvedValue({ status: "REVOKED" });
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "revoked@example.com",
    });
    expect(result).toEqual({ ok: true });
  });

  it("ACCEPTED な AdminInvitation は PENDING_INVITATION では無い (登録済み判定は user テーブル経由)", async () => {
    // ACCEPTED の場合、対応する User 行が居るのでそちらで弾く想定。
    adminInvitationFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    userFindFirst.mockResolvedValue({ role: "OWNER" });
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "accepted@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "ALREADY_REGISTERED" });
  });

  it("active な OWNER User が存在する email は ALREADY_REGISTERED", async () => {
    userFindFirst.mockResolvedValue({ role: "OWNER" });
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "owner@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "ALREADY_REGISTERED" });
  });

  it("active な非 OWNER User (CAST 等) は OTHER_ROLE_REGISTERED", async () => {
    userFindFirst.mockResolvedValue({ role: "CAST" });
    const caller = await createCaller();
    const result = await caller.auth.preflightOwnerSignup({
      email: "cast@example.com",
    });
    expect(result).toEqual({ ok: false, reason: "OTHER_ROLE_REGISTERED" });
  });

  it("soft-delete 済みユーザーは検索対象外 (deletedAt: null を where に含めている)", async () => {
    userFindFirst.mockResolvedValue(null);
    const caller = await createCaller();
    await caller.auth.preflightOwnerSignup({ email: "rejoin@example.com" });
    expect(userFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it("email 形式が不正なら BAD_REQUEST (zod parse 失敗)", async () => {
    const caller = await createCaller();
    await expect(
      caller.auth.preflightOwnerSignup({ email: "not-an-email" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
