import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  ownerProcedure,
} from "@/server/api/trpc";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase-storage";

export const ownerRouter = createTRPCRouter({
  /**
   * オーナープロフィール取得
   */
  getProfile: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        stores: {
          select: { id: true, name: true, area: true, isVerified: true },
          orderBy: { createdAt: "asc" },
        },
        subscription: true,
      },
    });

    return owner;
  }),

  /**
   * ダッシュボード用統合データ取得（1クエリ）
   */
  getDashboard: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            area: true,
            address: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: {
                offers: true,
                interviews: true,
              },
            },
          },
          orderBy: { createdAt: "asc" as const },
        },
        subscription: true,
      },
    });

    return owner;
  }),

  /**
   * オーナープロフィール更新
   *
   * Why: Owner スキーマには代表者・法人税務情報・住所・請求担当者のフィールドが
   * 定義済みだが、API がこれを露出していなかったため UI から保存できなかった。
   * 全フィールド optional で受け取り、空文字は null として保存する。
   */
  upsertProfile: ownerProcedure
    .input(
      z.object({
        companyName: z.string().max(200).optional(),
        representativeName: z.string().max(100).optional(),
        representativeFurigana: z.string().max(100).optional(),
        representativePhone: z.string().max(30).optional(),
        corporateNumber: z.string().max(13).optional(),
        invoiceRegistrationNumber: z.string().max(20).optional(),
        headOfficeAddress: z.string().max(300).optional(),
        billingAddress: z.string().max(300).optional(),
        billingContactName: z.string().max(100).optional(),
        billingContactEmail: z.string().email().max(254).or(z.literal("")).optional(),
        billingContactPhone: z.string().max(30).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 空文字は null に正規化（DB に "" を残さない）
      const norm = (v: string | undefined): string | null | undefined => {
        if (v === undefined) return undefined;
        const trimmed = v.trim();
        return trimmed === "" ? null : trimmed;
      };

      const data = {
        companyName: norm(input.companyName),
        representativeName: norm(input.representativeName),
        representativeFurigana: norm(input.representativeFurigana),
        representativePhone: norm(input.representativePhone),
        corporateNumber: norm(input.corporateNumber),
        invoiceRegistrationNumber: norm(input.invoiceRegistrationNumber),
        headOfficeAddress: norm(input.headOfficeAddress),
        billingAddress: norm(input.billingAddress),
        billingContactName: norm(input.billingContactName),
        billingContactEmail: norm(input.billingContactEmail),
        billingContactPhone: norm(input.billingContactPhone),
      };

      // upsert の create 側は null を許容 (createInput では undefined と同等)
      const createData: Prisma.OwnerCreateInput = {
        user: { connect: { id: ctx.session.user.id } },
        ...Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
        ),
      };

      const owner = await ctx.prisma.owner.upsert({
        where: { userId: ctx.session.user.id },
        update: data,
        create: createData,
      });

      return owner;
    }),

  /**
   * オーナーのログインメール / パスワード変更
   * 管理者が仮メール・仮パスワードで作成した後、本人がログインして自分の認証情報へ変更するためのAPI。
   */
  updateCredentials: ownerProcedure
    .input(
      z
        .object({
          email: z.string().email().max(320).optional(),
          newPassword: z.string().min(8).max(128).optional(),
        })
        .refine((v) => v.email !== undefined || v.newPassword !== undefined, {
          message: "変更するメールアドレスまたはパスワードを入力してください",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { id: true, email: true, supabaseAuthId: true },
      });
      if (!user?.supabaseAuthId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "認証ユーザーが見つかりません",
        });
      }

      const nextEmail = input.email?.trim().toLowerCase();
      if (nextEmail && nextEmail !== user.email) {
        const conflict = await ctx.prisma.user.findFirst({
          where: {
            email: nextEmail,
            deletedAt: null,
            id: { not: user.id },
          },
          select: { id: true },
        });
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "このメールアドレスは既に使われています",
          });
        }
      }

      const admin = getSupabaseAdminClient();
      const { error } = await admin.auth.admin.updateUserById(user.supabaseAuthId, {
        ...(nextEmail ? { email: nextEmail, email_confirm: true } : {}),
        ...(input.newPassword ? { password: input.newPassword } : {}),
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase credentials update failed: ${error.message}`,
        });
      }

      if (nextEmail && nextEmail !== user.email) {
        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { email: nextEmail, emailVerified: new Date() },
        });
      }

      return { success: true as const, email: nextEmail ?? user.email };
    }),

  /**
   * 所有店舗一覧
   */
  listStores: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!owner) {
      return [];
    }

    const stores = await ctx.prisma.store.findMany({
      where: { ownerId: owner.id },
      select: {
        id: true,
        name: true,
        area: true,
        address: true,
        photos: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            offers: true,
            interviews: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return stores;
  }),

  /**
   * 新規店舗追加
   */
  createStore: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        area: z.string().min(1).max(50),
        address: z.string().trim().min(1, "住所を入力してください").max(200),
        referralSource: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owner = await ctx.prisma.owner.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          subscription: true,
          _count: { select: { stores: true } },
        },
      });

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "オーナー情報が見つかりません",
        });
      }

      // プランに応じた店舗数上限チェック
      const maxStores = owner.subscription?.maxStores ?? 1;
      if (owner._count.stores >= maxStores) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `現在のプランでは${maxStores}店舗まで登録可能です。プランをアップグレードしてください。`,
        });
      }

      const store = await ctx.prisma.store.create({
        data: {
          ownerId: owner.id,
          name: input.name,
          area: input.area,
          address: input.address,
          isVerified: true,
          referralSource: input.referralSource,
        },
      });

      return store;
    }),

  /**
   * 店舗数取得
   */
  getStoreCount: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        subscription: { select: { maxStores: true } },
        _count: { select: { stores: true } },
      },
    });

    if (!owner) {
      return { current: 0, max: null };
    }

    return {
      current: owner._count.stores,
      max: owner.subscription?.maxStores ?? 1,
    };
  }),

  /**
   * 店舗別オファー統計取得
   */
  getOfferStats: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!owner) return [];

    const stores = await ctx.prisma.store.findMany({
      where: { ownerId: owner.id },
      select: { id: true, name: true, area: true },
      orderBy: { createdAt: "asc" },
    });

    if (stores.length === 0) return [];

    const storeIds = stores.map((s) => s.id);

    // groupBy で全店舗のオファーステータスを1クエリで取得
    const [offerGroups, interviewGroups] = await Promise.all([
      ctx.prisma.offer.groupBy({
        by: ["storeId", "status"],
        where: { storeId: { in: storeIds } },
        _count: true,
      }),
      ctx.prisma.interview.groupBy({
        by: ["storeId"],
        where: { storeId: { in: storeIds } },
        _count: true,
      }),
    ]);

    // 店舗IDごとにステータス別カウントをマッピング
    const offerMap = new Map<string, Record<string, number>>();
    for (const row of offerGroups) {
      const existing = offerMap.get(row.storeId) ?? {};
      offerMap.set(row.storeId, { ...existing, [row.status]: row._count });
    }

    const interviewMap = new Map<string, number>();
    for (const row of interviewGroups) {
      interviewMap.set(row.storeId, row._count);
    }

    return stores.map((store) => {
      const counts = offerMap.get(store.id) ?? {};
      const pending = counts["PENDING"] ?? 0;
      const accepted = counts["ACCEPTED"] ?? 0;
      const rejected = counts["REJECTED"] ?? 0;
      const expired = counts["EXPIRED"] ?? 0;
      const total = pending + accepted + rejected + expired;
      const interviews = interviewMap.get(store.id) ?? 0;

      return {
        storeId: store.id,
        storeName: store.name,
        storeArea: store.area,
        total,
        pending,
        accepted,
        rejected,
        expired,
        interviews,
        acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      };
    });
  }),

  /**
   * アカウント削除（退会）
   *
   * Why: ユーザーがオーナーアカウントを退会できる導線が無く、解約フロー
   * から逃げ道がなかった。ソフトデリート方式で User/Owner/Store に
   * deletedAt をセットし、Supabase Auth ユーザーは削除して再ログイン
   * できないようにする。
   *
   * 有料サブスクが残っている場合は、Stripe を即時キャンセルしてから
   * 退会する（ユーザー選択: 自動キャンセル）。
   */
  deleteAccount: ownerProcedure
    .input(
      z.object({
        confirmText: z.literal("DELETE"),
      })
    )
    .mutation(async ({ ctx }) => {
      const owner = await ctx.prisma.owner.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          subscription: true,
          stores: { select: { id: true } },
        },
      });

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "オーナー情報が見つかりません",
        });
      }

      // トランザクション前に supabaseAuthId を取得しておく
      // （トランザクション内で null に書き換えるため）
      const userBefore = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { supabaseAuthId: true, email: true },
      });

      // 1. Stripe サブスクの即時キャンセル（有料プランのみ）
      const stripeSubscriptionId = owner.subscription?.stripeSubscriptionId;
      const isPaidPlan =
        owner.subscription?.plan && owner.subscription.plan !== "FREE";

      if (stripeSubscriptionId && isPaidPlan) {
        try {
          await getStripe().subscriptions.cancel(stripeSubscriptionId);
        } catch (e) {
          // Stripe 側で既に解約済み等は許容（ログのみ残して退会は続行）
          const message = e instanceof Error ? e.message : String(e);
          console.error("[deleteAccount] Stripe cancel failed (continuing)", {
            stripeSubscriptionId,
            error: message,
          });
        }
      }

      const now = new Date();

      // 2. DB をトランザクションでソフトデリート
      await ctx.prisma.$transaction(async (tx) => {
        // Store: 全店舗を非公開化
        if (owner.stores.length > 0) {
          await tx.store.updateMany({
            where: { ownerId: owner.id },
            data: { deletedAt: now },
          });
        }

        // Owner: 退会フラグ
        await tx.owner.update({
          where: { id: owner.id },
          data: { deletedAt: now },
        });

        // Subscription: ステータスを CANCELED に
        if (owner.subscription) {
          await tx.subscription.update({
            where: { id: owner.subscription.id },
            data: { status: "CANCELLED" },
          });
        }

        // User: 退会フラグ + 認証情報を切り離し（再登録時の重複回避）
        // Email は UNIQUE 制約があるので suffix を付けて退避。
        await tx.user.update({
          where: { id: ctx.session.user.id },
          data: {
            deletedAt: now,
            email: userBefore?.email
              ? `${userBefore.email}.deleted-${now.getTime()}`
              : null,
            supabaseAuthId: null,
          },
        });
      });

      // 3. Supabase Auth ユーザー削除（service role 必須）
      // DB 側のソフトデリートが完了してから実施。失敗しても DB の整合性は保てる。
      if (userBefore?.supabaseAuthId) {
        try {
          const admin = getSupabaseAdminClient();
          await admin.auth.admin.deleteUser(userBefore.supabaseAuthId);
        } catch (e) {
          // Supabase 側の削除失敗は致命的ではない（DB 側は既に退会済）。
          // ログだけ残してクライアントには成功を返す。
          const message = e instanceof Error ? e.message : String(e);
          console.error("[deleteAccount] Supabase admin delete failed", {
            supabaseAuthId: userBefore.supabaseAuthId,
            error: message,
          });
        }
      }

      return { success: true as const };
    }),
});
