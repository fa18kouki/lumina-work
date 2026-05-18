import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseGetUserMock = vi.fn();
const prismaUserFindUniqueMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: () => undefined }),
}));

vi.mock("@/lib/supabase-auth", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: supabaseGetUserMock },
  })),
}));

vi.mock("@/server/db", () => ({
  prisma: {
    user: { findUnique: prismaUserFindUniqueMock },
  },
}));

describe("auth-cached", () => {
  beforeEach(() => {
    supabaseGetUserMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("getCachedSupabaseUser は supabase.auth.getUser の user を返す", async () => {
    supabaseGetUserMock.mockResolvedValue({
      data: { user: { id: "auth-1", email: "a@example.com" } },
      error: null,
    });

    const { getCachedSupabaseUser } = await import("@/lib/auth-cached");
    const result = await getCachedSupabaseUser();

    expect(result?.id).toBe("auth-1");
  });

  it("getCachedSupabaseUser は error 時 null を返す", async () => {
    supabaseGetUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "no session" },
    });

    const { getCachedSupabaseUser } = await import("@/lib/auth-cached");
    const result = await getCachedSupabaseUser();

    expect(result).toBeNull();
  });

  it("getCachedPrismaUserBySupabaseId は supabaseAuthId をキーに Prisma User を解決する", async () => {
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "prisma-key1",
      email: "a@example.com",
      image: null,
      role: "OWNER",
    });

    const { getCachedPrismaUserBySupabaseId } = await import("@/lib/auth-cached");
    const result = await getCachedPrismaUserBySupabaseId("auth-key1");

    expect(result?.id).toBe("prisma-key1");
    expect(prismaUserFindUniqueMock).toHaveBeenCalledWith({
      where: { supabaseAuthId: "auth-key1" },
      select: { id: true, email: true, image: true, role: true, deletedAt: true },
    });
  });

  // NOTE: 「同一リクエスト内で重複呼び出しが抑止される」memoize 動作は
  // React `cache()` primitive の責務として信頼する。Vitest は Server
  // Component runtime を持たないため call count での verify は不安定で、
  // ここでは関数の正しさのみ担保。本番 (Next.js App Router) で実機検証。
});
