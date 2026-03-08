import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createAdminCaller,
  createNonAdminCaller,
  createTestAdminUser,
  createTestCastUser,
  cleanupTestData,
  prisma,
} from "./__helpers__/setup";

describe("admin.casts", () => {
  let adminUserId: string;
  let nonAdminUserId: string;

  beforeAll(async () => {
    await cleanupTestData();

    const adminUser = await createTestAdminUser({
      id: "admin-casts-test",
      email: "admin-casts@test.com",
    });
    adminUserId = adminUser.id;

    const castUser = await createTestCastUser(
      { id: "cast-casts-test", email: "cast-casts@test.com" },
      { nickname: "テストキャスト" }
    );
    nonAdminUserId = castUser.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("list", () => {
    beforeEach(async () => {
      // テスト用キャストを追加作成
      await prisma.cast.deleteMany({
        where: {
          userId: { notIn: [adminUserId, nonAdminUserId] },
        },
      });
    });

    it("管理者はキャスト一覧を取得できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.list({});

      expect(result).toBeDefined();
      expect(result.casts).toBeDefined();
      expect(Array.isArray(result.casts)).toBe(true);
    });

    it("検証状態でフィルターできる", async () => {
      // 未検証キャストを追加
      await createTestCastUser(
        { email: "unverified@test.com" },
        { nickname: "未検証キャスト", idVerified: false }
      );
      // 検証済みキャストを追加
      await createTestCastUser(
        { email: "verified@test.com" },
        { nickname: "検証済みキャスト", idVerified: true }
      );

      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.list({ idVerified: true });

      result.casts.forEach((cast) => {
        expect(cast.idVerified).toBe(true);
      });
    });

    it("停止状態でフィルターできる", async () => {
      await createTestCastUser(
        { email: "suspended@test.com" },
        { nickname: "停止中キャスト", isSuspended: true }
      );

      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.list({ isSuspended: true });

      result.casts.forEach((cast) => {
        expect(cast.isSuspended).toBe(true);
      });
    });

    it("ランクでフィルターできる", async () => {
      await createTestCastUser(
        { email: "gold@test.com" },
        { nickname: "Aランクキャスト", rank: "A" }
      );

      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.list({ rank: "A" });

      result.casts.forEach((cast) => {
        expect(cast.rank).toBe("A");
      });
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(caller.admin.casts.list({})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("getById", () => {
    let testCastId: string;

    beforeAll(async () => {
      const castUser = await createTestCastUser(
        { email: "getbyid-cast@test.com" },
        { nickname: "詳細テストキャスト" }
      );
      testCastId = castUser.cast.id;
    });

    it("管理者はキャスト詳細を取得できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.getById({ castId: testCastId });

      expect(result).toBeDefined();
      expect(result.id).toBe(testCastId);
      expect(result.nickname).toBe("詳細テストキャスト");
    });

    it("存在しないキャストはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.casts.getById({ castId: "non-existent-id" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("verifyId", () => {
    let unverifiedCastId: string;

    beforeEach(async () => {
      const castUser = await createTestCastUser(
        { email: `verify-${Date.now()}@test.com` },
        { nickname: "検証待ちキャスト", idVerified: false }
      );
      unverifiedCastId = castUser.cast.id;
    });

    it("管理者はキャストの本人確認を行える", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.verifyId({
        castId: unverifiedCastId,
        verified: true,
      });

      expect(result.id).toBe(unverifiedCastId);
      expect(result.idVerified).toBe(true);
    });

    it("本人確認を取り消せる", async () => {
      // まず検証
      await prisma.cast.update({
        where: { id: unverifiedCastId },
        data: { idVerified: true },
      });

      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.verifyId({
        castId: unverifiedCastId,
        verified: false,
      });

      expect(result.idVerified).toBe(false);
    });

    it("非管理者はアクセスできない", async () => {
      const caller = createNonAdminCaller(nonAdminUserId);

      await expect(
        caller.admin.casts.verifyId({
          castId: unverifiedCastId,
          verified: true,
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("updateRank", () => {
    let testCastId: string;

    beforeEach(async () => {
      const castUser = await createTestCastUser(
        { email: `rank-${Date.now()}@test.com` },
        { nickname: "ランクテストキャスト", rank: "C" }
      );
      testCastId = castUser.cast.id;
    });

    it("管理者はキャストのランクを更新できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.updateRank({
        castId: testCastId,
        rank: "B",
      });

      expect(result.id).toBe(testCastId);
      expect(result.rank).toBe("B");
    });

    it("存在しないキャストはNOT_FOUNDエラー", async () => {
      const caller = createAdminCaller(adminUserId);

      await expect(
        caller.admin.casts.updateRank({
          castId: "non-existent-id",
          rank: "A",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("suspend", () => {
    let testCastId: string;

    beforeEach(async () => {
      const castUser = await createTestCastUser(
        { email: `suspend-cast-${Date.now()}@test.com` },
        { nickname: "停止テストキャスト", isSuspended: false }
      );
      testCastId = castUser.cast.id;
    });

    it("管理者はキャストを停止できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.suspend({
        castId: testCastId,
        reason: "テスト停止理由",
      });

      expect(result.success).toBe(true);

      const cast = await prisma.cast.findUnique({
        where: { id: testCastId },
      });
      expect(cast?.isSuspended).toBe(true);
    });
  });

  describe("unsuspend", () => {
    let suspendedCastId: string;

    beforeEach(async () => {
      const castUser = await createTestCastUser(
        { email: `unsuspend-cast-${Date.now()}@test.com` },
        {
          nickname: "停止解除テストキャスト",
          isSuspended: true,
          penaltyCount: 3,
        }
      );
      suspendedCastId = castUser.cast.id;
    });

    it("管理者はキャストの停止を解除できる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.unsuspend({
        castId: suspendedCastId,
      });

      expect(result.success).toBe(true);

      const cast = await prisma.cast.findUnique({
        where: { id: suspendedCastId },
      });
      expect(cast?.isSuspended).toBe(false);
    });

    it("ペナルティカウントをリセットできる", async () => {
      const caller = createAdminCaller(adminUserId);
      const result = await caller.admin.casts.unsuspend({
        castId: suspendedCastId,
        resetPenaltyCount: true,
      });

      expect(result.success).toBe(true);

      const cast = await prisma.cast.findUnique({
        where: { id: suspendedCastId },
      });
      expect(cast?.penaltyCount).toBe(0);
    });
  });
});
