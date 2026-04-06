import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-auth";

/**
 * コンテキスト型の定義
 */
export interface CreateContextOptions {
  session: Session | null;
}

/**
 * 内部コンテキスト作成（テスト用）
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    /** バッチリクエスト内で owner ルックアップを共有するキャッシュ */
    ownerCache: new Map<string, { id: string; referralCode: string | null }>(),
  };
};

/**
 * Supabase Auth セッションから NextAuth 形式のセッションを復元
 */
async function getSupabaseSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<Session | null> {
  try {
    const supabase = createServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const prismaUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, email: true, image: true, role: true },
    });

    // Prisma ユーザーが存在しない場合は null を返す。
    // ユーザー作成は正規フロー（/api/auth/callback または /api/auth/sync-cast-user）に任せる。
    if (!prismaUser) {
      return null;
    }

    return {
      user: {
        id: prismaUser.id,
        email: prismaUser.email,
        name: null,
        image: prismaUser.image,
        role: prismaUser.role,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * APIリクエスト用コンテキスト作成
 */
export const createTRPCContext = async () => {
  const cookieStore = await cookies();

  // NextAuth セッション Cookie が存在する場合のみ auth() を呼ぶ（キャスト側）
  // オーナー側は Supabase Auth のみ使用するため、auth() のオーバーヘッドを回避
  const hasNextAuthCookie =
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token");

  let session: Session | null = null;

  if (hasNextAuthCookie) {
    session = await auth();
  }

  // NextAuth セッションがない場合、Supabase Auth を確認（店舗側）
  if (!session) {
    session = await getSupabaseSession(cookieStore);
  }

  return createInnerTRPCContext({
    session,
  });
};

/**
 * tRPC初期化
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * ルーター作成
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * パブリックプロシージャ（認証不要）
 */
export const publicProcedure = t.procedure;

/**
 * 認証済みプロシージャ
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * キャスト専用プロシージャ
 */
export const castProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "CAST") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "キャストのみアクセス可能です",
    });
  }

  return next({ ctx });
});

/**
 * オーナー専用プロシージャ
 */
export const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "オーナーのみアクセス可能です",
    });
  }

  return next({ ctx });
});

/**
 * オーナーレコードをコンテキストに解決するプロシージャ。
 * 複数ハンドラーが同じオーナーIDを必要とする場合に使用。
 * バッチリクエスト内では ownerCache で重複クエリを回避。
 */
export const ownerWithRecordProcedure = ownerProcedure.use(
  async ({ ctx, next }) => {
    const userId = ctx.session.user.id;
    const cached = ctx.ownerCache.get(userId);
    if (cached) {
      return next({ ctx: { ...ctx, owner: cached } });
    }

    const owner = await ctx.prisma.owner.findUnique({
      where: { userId },
      select: { id: true, referralCode: true },
    });

    if (!owner) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "オーナー情報が見つかりません",
      });
    }

    ctx.ownerCache.set(userId, owner);

    return next({ ctx: { ...ctx, owner } });
  },
);

/**
 * オーナーが所有する店舗を解決するヘルパー
 */
export async function resolveOwnerStore(
  prisma: typeof import("@/server/db").prisma,
  userId: string,
  storeId: string,
) {
  const owner = await prisma.owner.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!owner) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "オーナー情報が見つかりません",
    });
  }

  const store = await prisma.store.findFirst({
    where: { id: storeId, ownerId: owner.id },
  });

  if (!store) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "店舗が見つかりません、またはアクセス権限がありません",
    });
  }

  return { owner, store };
}

/**
 * 管理者専用プロシージャ
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者のみアクセス可能です",
    });
  }

  return next({ ctx });
});
