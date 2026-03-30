import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createAdminCaller,
  createNonAdminCaller,
  createUnauthenticatedCaller,
  createTestAdminUser,
  createTestCastUser,
  createTestStoreUser,
  cleanupTestData,
  prisma,
} from "./__helpers__/setup";

describe("admin.users", () => {
  let adminUserId: string;
  let nonAdminUserId: string;

  beforeAll(async () => {
    await cleanupTestData();

    const adminUser = await createTestAdminUser({
      id: "admin-users-test",
      email: "admin-users@test.com",
    });
    adminUserId = adminUser.id;

    const castUser = await createTestCastUser(
      { id: "cast-users-test", email: "cast-users@test.com" },
      { nickname: "テストキャスト" }
    );
    nonAdminUserId = castUser.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("list", () => {
    beforeEach(async () => {
      // テスト用ユーザーを追加（基本ユーザーは残す）
      await prisma.user.deleteMany({
        where: {
          id: { notIn: [adminUserId, nonAdminUserId] },
        },
      });
    });

    it("管理者はユーザー一覧を取得できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.list({});

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThanOrEqual(2);
    });

    it("ロールでフィルターできる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.list({ role: "CAST" });

      result.users.forEach((user) => {
        expect(user.role).toBe("CAST");
      });
    });

    it("検索キーワードでフィルターできる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.list({ search: "cast-users" });

      expect(result.users.length).toBeGreaterThanOrEqual(1);
      expect(result.users.some((u) => u.email?.includes("cast-users"))).toBe(
        true
      );
    });

    it("ページネーションが機能する", async () => {
      // 追加ユーザーを作成
      await createTestCastUser(
        { email: "pagination-1@test.com" },
        { nickname: "ページ1" }
      );
      await createTestCastUser(
        { email: "pagination-2@test.com" },
        { nickname: "ページ2" }
      );
      await createTestCastUser(
        { email: "pagination-3@test.com" },
        { nickname: "ページ3" }
      );

      const caller = createAdminCaller(adminUserId);
      const firstPage = await caller.admin.users.list({ limit: 2 });

      expect(firstPage.users.length).toBe(2);
      expect(firstPage.nextCursor).toBeDefined();

      const secondPage = await caller.admin.users.list({
        limit: 2,
        cursor: firstPage.nextCursor,
      });

      expect(secondPage.users.length).toBeGreaterThanOrEqual(1);
      expect(secondPage.users[0].id).not.toBe(firstPage.users[0].id);
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(caller.admin.users.list({})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("未認証ユーザーはアクセスできない", async () => {
      const caller = createUnauthenticatedCaller();

      await expect(caller.admin.users.list({})).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("getById", () => {
    it("管理者はユーザー詳細を取得できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.getById({ userId: nonAdminUserId });

      expect(result).toBeDefined();
      expect(result.id).toBe(nonAdminUserId);
      expect(result.email).toBe("cast-users@test.com");
      expect(result.role).toBe("CAST");
      expect(result.cast).toBeDefined();
    });

    it("存在しないユーザーはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.users.getById({ userId: "non-existent-id" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(
        caller.admin.users.getById({ userId: adminUserId })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("updateRole", () => {
    let testUserId: string;

    beforeEach(async () => {
      const testUser = await createTestCastUser(
        { email: `role-test-${Date.now()}@test.com` },
        { nickname: "ロールテスト" }
      );
      testUserId = testUser.id;
    });

    it("管理者はユーザーのロールを変更できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.updateRole({
        userId: testUserId,
        role: "OWNER",
      });

      expect(result.id).toBe(testUserId);
      expect(result.role).toBe("OWNER");

      // データベースでも確認
      const updated = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(updated?.role).toBe("OWNER");
    });

    it("存在しないユーザーはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.users.updateRole({
          userId: "non-existent-id",
          role: "ADMIN",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(
        caller.admin.users.updateRole({
          userId: testUserId,
          role: "ADMIN",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("suspend", () => {
    let testCastUserId: string;

    beforeEach(async () => {
      const testUser = await createTestCastUser(
        { email: `suspend-test-${Date.now()}@test.com` },
        { nickname: "停止テスト", isSuspended: false }
      );
      testCastUserId = testUser.id;
    });

    it("管理者はキャストユーザーを停止できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.suspend({
        userId: testCastUserId,
        reason: "テスト停止理由",
      });

      expect(result.success).toBe(true);

      // キャストが停止されたことを確認
      const cast = await prisma.cast.findUnique({
        where: { userId: testCastUserId },
      });
      expect(cast?.isSuspended).toBe(true);
    });

    it("存在しないユーザーはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.users.suspend({ userId: "non-existent-id" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(
        caller.admin.users.suspend({ userId: testCastUserId })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("unsuspend", () => {
    let suspendedCastUserId: string;

    beforeEach(async () => {
      const testUser = await createTestCastUser(
        { email: `unsuspend-test-${Date.now()}@test.com` },
        { nickname: "停止解除テスト", isSuspended: true }
      );
      suspendedCastUserId = testUser.id;
    });

    it("管理者は停止中のキャストを復帰できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.users.unsuspend({
        userId: suspendedCastUserId,
      });

      expect(result.success).toBe(true);

      // キャストが復帰したことを確認
      const cast = await prisma.cast.findUnique({
        where: { userId: suspendedCastUserId },
      });
      expect(cast?.isSuspended).toBe(false);
    });

    it("存在しないユーザーはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.users.unsuspend({ userId: "non-existent-id" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(
        caller.admin.users.unsuspend({ userId: suspendedCastUserId })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });
});
