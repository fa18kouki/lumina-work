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
  };
};

/**
 * Supabase Auth セッションから NextAuth 形式のセッションを復元
 */
async function getSupabaseSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let prismaUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, email: true, image: true, role: true },
    });

    // Prisma ユーザーが存在しない場合（callback を経由せずログインした場合など）自動作成
    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.email_confirmed_at
            ? new Date(user.email_confirmed_at)
            : null,
          role: "STORE",
          supabaseAuthId: user.id,
        },
        select: { id: true, email: true, image: true, role: true },
      });
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
  // NextAuth セッションを優先（キャスト側）
  let session = await auth();

  // NextAuth セッションがない場合、Supabase Auth を確認（店舗側）
  if (!session) {
    session = await getSupabaseSession();
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
export const castProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (user?.role !== "CAST") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "キャストのみアクセス可能です",
    });
  }

  return next({ ctx });
});

/**
 * 店舗専用プロシージャ
 */
export const storeProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (user?.role !== "STORE") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "店舗のみアクセス可能です",
    });
  }

  return next({ ctx });
});

/**
 * 管理者専用プロシージャ
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者のみアクセス可能です",
    });
  }

  return next({ ctx });
});
