import { createInnerTRPCContext } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import { prisma } from "@/server/db";
import type { User, Cast, Store } from "@prisma/client";

/**
 * 管理者用のtRPC callerを作成
 */
export const createAdminCaller = (adminUserId = "admin-test-user-id") => {
  const ctx = createInnerTRPCContext({
    session: {
      user: { id: adminUserId },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  return appRouter.createCaller(ctx);
};

/**
 * 非管理者用のtRPC callerを作成
 */
export const createNonAdminCaller = (userId = "non-admin-test-user-id") => {
  const ctx = createInnerTRPCContext({
    session: {
      user: { id: userId },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  return appRouter.createCaller(ctx);
};

/**
 * 未認証のtRPC callerを作成
 */
export const createUnauthenticatedCaller = () => {
  const ctx = createInnerTRPCContext({
    session: null,
  });
  return appRouter.createCaller(ctx);
};

/**
 * テスト用の管理者ユーザーを作成
 */
export const createTestAdminUser = async (
  overrides?: Partial<User>
): Promise<User> => {
  return prisma.user.create({
    data: {
      id: overrides?.id ?? `admin-${Date.now()}`,
      email: overrides?.email ?? `admin-${Date.now()}@test.com`,
      role: "ADMIN",
      ...overrides,
    },
  });
};

/**
 * テスト用のキャストユーザーを作成
 */
export const createTestCastUser = async (
  overrides?: Partial<User>,
  castOverrides?: Partial<Cast>
): Promise<User & { cast: Cast }> => {
  const userId = overrides?.id ?? `cast-user-${Date.now()}`;
  return prisma.user.create({
    data: {
      id: userId,
      email: overrides?.email ?? `cast-${Date.now()}@test.com`,
      role: "CAST",
      ...overrides,
      cast: {
        create: {
          nickname: castOverrides?.nickname ?? `テストキャスト${Date.now()}`,
          age: castOverrides?.age ?? 25,
          desiredAreas: castOverrides?.desiredAreas ?? ["銀座"],
          ...castOverrides,
        },
      },
    },
    include: { cast: true },
  }) as Promise<User & { cast: Cast }>;
};

/**
 * テスト用の店舗ユーザーを作成
 */
export const createTestStoreUser = async (
  overrides?: Partial<User>,
  storeOverrides?: Partial<Store>
): Promise<User & { owner: { id: string; stores: Store[] } }> => {
  const userId = overrides?.id ?? `store-user-${Date.now()}`;
  return prisma.user.create({
    data: {
      id: userId,
      email: overrides?.email ?? `store-${Date.now()}@test.com`,
      role: "OWNER",
      ...overrides,
      owner: {
        create: {
          stores: {
            create: {
              name: storeOverrides?.name ?? `テスト店舗${Date.now()}`,
              area: storeOverrides?.area ?? "六本木",
              address: storeOverrides?.address ?? "東京都港区六本木1-1-1",
              ...storeOverrides,
            },
          },
        },
      },
    },
    include: { owner: { include: { stores: true } } },
  }) as Promise<User & { owner: { id: string; stores: Store[] } }>;
};

/**
 * テストデータをクリーンアップ
 */
export const cleanupTestData = async () => {
  await prisma.penalty.deleteMany({});
  await prisma.messageImage.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.cast.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
};

export { prisma };
