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

describe("auth-cached: 1 リクエスト内で重複呼び出しを抑止する", () => {
  beforeEach(() => {
    vi.resetModules();
    supabaseGetUserMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("getCachedSupabaseUser を同一リクエスト内で2回呼んでも supabase.auth.getUser は1回", async () => {
    supabaseGetUserMock.mockResolvedValue({
      data: { user: { id: "auth-1", email: "a@example.com" } },
      error: null,
    });

    const { getCachedSupabaseUser } = await import("@/lib/auth-cached");

    const a = await getCachedSupabaseUser();
    const b = await getCachedSupabaseUser();

    expect(a?.id).toBe("auth-1");
    expect(b?.id).toBe("auth-1");
    expect(supabaseGetUserMock).toHaveBeenCalledTimes(1);
  });

  it("getCachedPrismaUserBySupabaseId を同一リクエスト内で2回呼んでも prisma.user.findUnique は1回", async () => {
    prismaUserFindUniqueMock.mockResolvedValue({
      id: "prisma-1",
      email: "a@example.com",
      image: null,
      role: "OWNER",
    });

    const { getCachedPrismaUserBySupabaseId } = await import("@/lib/auth-cached");

    const a = await getCachedPrismaUserBySupabaseId("auth-1");
    const b = await getCachedPrismaUserBySupabaseId("auth-1");

    expect(a?.id).toBe("prisma-1");
    expect(b?.id).toBe("prisma-1");
    expect(prismaUserFindUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("異なる supabaseAuthId は別キーとしてキャッシュされる", async () => {
    prismaUserFindUniqueMock
      .mockResolvedValueOnce({ id: "prisma-A", role: "OWNER" })
      .mockResolvedValueOnce({ id: "prisma-B", role: "CAST" });

    const { getCachedPrismaUserBySupabaseId } = await import("@/lib/auth-cached");

    const a = await getCachedPrismaUserBySupabaseId("auth-A");
    const b = await getCachedPrismaUserBySupabaseId("auth-B");

    expect(a?.id).toBe("prisma-A");
    expect(b?.id).toBe("prisma-B");
    expect(prismaUserFindUniqueMock).toHaveBeenCalledTimes(2);
  });
});
