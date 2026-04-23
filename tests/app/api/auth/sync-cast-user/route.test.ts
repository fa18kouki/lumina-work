import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-auth", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

const mockUserFindUnique = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserCreate = vi.fn();
const mockCastCreate = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    cast: {
      create: (...args: unknown[]) => mockCastCreate(...args),
    },
  },
}));

import { POST } from "@/app/api/auth/sync-cast-user/route";

describe("POST /api/auth/sync-cast-user - Cast 自動生成のダミー値禁止", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "supabase-user-1",
          email: "cast@example.com",
          email_confirmed_at: new Date("2026-04-01").toISOString(),
        },
      },
      error: null,
    });
  });

  it("新規キャスト作成時、Cast が nickname='' / age 未指定 / isAvailableNow 未指定 で作られる", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: "new-cast-user",
      email: "cast@example.com",
    });
    mockCastCreate.mockResolvedValue({ id: "cast-1" });

    const res = await POST();
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(mockCastCreate).toHaveBeenCalledTimes(1);

    const callArgs = mockCastCreate.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(callArgs.data.userId).toBe("new-cast-user");
    expect(callArgs.data.nickname).toBe("");
    expect(callArgs.data.age).toBeUndefined();
    expect(callArgs.data.isAvailableNow).toBeUndefined();
    expect(callArgs.data.photos).toEqual([]);
    expect(callArgs.data.desiredAreas).toEqual([]);
    expect(callArgs.data.preferredAtmosphere).toEqual([]);
    expect(callArgs.data.preferredClientele).toEqual([]);
  });

  it("既存ユーザーにログインする場合は Cast を作らない", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "existing-user",
      email: "cast@example.com",
    });

    const res = await POST();
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(mockCastCreate).not.toHaveBeenCalled();
  });
});
