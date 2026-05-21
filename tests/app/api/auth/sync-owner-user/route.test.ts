import { describe, it, expect, vi, beforeEach } from "vitest";

// next/headers をモック
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

// Supabase を制御可能にモック
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-auth", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Prisma を制御可能にモック
const mockUserFindUnique = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserCreate = vi.fn();
const mockOwnerCreate = vi.fn();
const mockAdminInvitationFindUnique = vi.fn();
const mockAdminInvitationUpdateMany = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    owner: {
      create: (...args: unknown[]) => mockOwnerCreate(...args),
    },
    adminInvitation: {
      findUnique: (...args: unknown[]) =>
        mockAdminInvitationFindUnique(...args),
      updateMany: (...args: unknown[]) =>
        mockAdminInvitationUpdateMany(...args),
    },
  },
}));

import { POST } from "@/app/api/auth/sync-owner-user/route";

describe("POST /api/auth/sync-owner-user - soft delete 対応", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "supabase-user-1",
          email: "owner@example.com",
          email_confirmed_at: new Date("2026-04-01").toISOString(),
        },
      },
      error: null,
    });
    // 招待が無いケースをデフォルトに (markAdminInvitationAccepted は no-op)
    mockAdminInvitationFindUnique.mockResolvedValue(null);
  });

  it("既存メールの重複チェックで deletedAt: null を条件に含める", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "new-user", email: "owner@example.com" });
    mockOwnerCreate.mockResolvedValue({ id: "owner-1" });

    await POST();

    expect(mockUserFindFirst).toHaveBeenCalledTimes(1);
    const args = mockUserFindFirst.mock.calls[0][0];
    expect(args.where).toMatchObject({
      email: "owner@example.com",
      role: "OWNER",
      deletedAt: null,
    });
  });

  it("既存ユーザーが soft-delete 済 (findFirst が null 相当) でも新規作成に進む", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    // 実装側で deletedAt: null フィルタが効くため、soft-delete 済ユーザーはヒットしない
    mockUserFindFirst.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "new-user", email: "owner@example.com" });
    mockOwnerCreate.mockResolvedValue({ id: "owner-1" });

    const res = await POST();
    const body = await res.json();

    expect(mockUserCreate).toHaveBeenCalledOnce();
    expect(mockOwnerCreate).toHaveBeenCalledOnce();
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("new-user");
  });
});
