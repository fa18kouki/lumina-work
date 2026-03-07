import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { dispatchNotification } from "@/server/notifications";
import { shouldThrottle } from "@/server/notifications/throttle";

export const messageRouter = createTRPCRouter({
  /**
   * メッセージ送信
   */
  send: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        content: z.string().max(2000).optional(),
        imageUrls: z.array(z.string().url()).max(5).optional(),
      }).refine(
        (data) => (data.content && data.content.trim().length > 0) || (data.imageUrls && data.imageUrls.length > 0),
        { message: "テキストまたは画像のいずれかが必要です" }
      )
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          cast: { select: { id: true } },
          store: { select: { id: true } },
        },
      });

      const castId = user?.cast?.id;
      const storeId = user?.store?.id;

      // 自分に関連するか確認
      const match = await ctx.prisma.match.findFirst({
        where: {
          id: input.matchId,
          status: "ACCEPTED",
          OR: [
            { castId: castId ?? "" },
            { storeId: storeId ?? "" },
          ],
        },
        include: {
          cast: {
            select: {
              userId: true,
              nickname: true,
              lineUserId: true,
              user: { select: { email: true } },
            },
          },
          store: {
            select: {
              userId: true,
              name: true,
              user: { select: { email: true } },
            },
          },
        },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "該当するやりとりが見つからないか、メッセージを送信できません",
        });
      }

      const message = await ctx.prisma.message.create({
        data: {
          matchId: input.matchId,
          senderId: ctx.session.user.id,
          content: input.content?.trim() || null,
          ...(input.imageUrls && input.imageUrls.length > 0
            ? {
                images: {
                  create: input.imageUrls.map((url, index) => ({
                    url,
                    order: index,
                  })),
                },
              }
            : {}),
        },
        include: {
          images: { orderBy: { order: "asc" } },
        },
      });

      // 受信者に通知送信
      const isSenderCast = match.cast.userId === ctx.session.user.id;
      const messagePreview = input.content?.trim().slice(0, 50) ?? "画像が送信されました";

      if (isSenderCast) {
        // キャストが送信 → 店舗に通知
        // InApp通知は常に作成（スロットリングはLINE/Email用）
        await dispatchNotification({
          type: "MESSAGE_RECEIVED_STORE",
          payload: {
            recipientUserId: match.store.userId,
            matchId: input.matchId,
            storeEmail: shouldThrottle(input.matchId, match.store.userId)
              ? null // スロットリング中はEmailスキップ
              : match.store.user.email,
            senderName: match.cast.nickname ?? "キャスト",
            messagePreview,
          },
        });
      } else {
        // 店舗が送信 → キャストに通知
        const throttled = shouldThrottle(input.matchId, match.cast.userId);
        await dispatchNotification({
          type: "MESSAGE_RECEIVED_CAST",
          payload: {
            recipientUserId: match.cast.userId,
            matchId: input.matchId,
            castLineUserId: throttled ? null : match.cast.lineUserId,
            castEmail: throttled ? null : match.cast.user.email,
            senderName: match.store.name,
            messagePreview,
          },
        });
      }

      return message;
    }),

  /**
   * メッセージ一覧取得
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          cast: { select: { id: true } },
          store: { select: { id: true } },
        },
      });

      const castId = user?.cast?.id;
      const storeId = user?.store?.id;

      // 自分に関連するか確認
      const match = await ctx.prisma.match.findFirst({
        where: {
          id: input.matchId,
          OR: [
            { castId: castId ?? "" },
            { storeId: storeId ?? "" },
          ],
        },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "該当するやりとりが見つかりません",
        });
      }

      const messages = await ctx.prisma.message.findMany({
        where: { matchId: input.matchId },
        include: {
          sender: {
            select: {
              id: true,
              image: true,
            },
          },
          images: { orderBy: { order: "asc" } },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      // 未読メッセージを既読に
      await ctx.prisma.message.updateMany({
        where: {
          matchId: input.matchId,
          senderId: { not: ctx.session.user.id },
          isRead: false,
        },
        data: { isRead: true },
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.reverse(), // 時系列順に
        nextCursor,
      };
    }),

  /**
   * 未読メッセージ数取得
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        cast: { select: { id: true } },
        store: { select: { id: true } },
      },
    });

    const castId = user?.cast?.id;
    const storeId = user?.store?.id;

    if (!castId && !storeId) {
      return { count: 0 };
    }

    // 自分が関連するやりとりを取得
    const matches = await ctx.prisma.match.findMany({
      where: {
        OR: [
          { castId: castId ?? "" },
          { storeId: storeId ?? "" },
        ],
        status: "ACCEPTED",
      },
      select: { id: true },
    });

    const matchIds = matches.map((m) => m.id);

    const count = await ctx.prisma.message.count({
      where: {
        matchId: { in: matchIds },
        senderId: { not: ctx.session.user.id },
        isRead: false,
      },
    });

    return { count };
  }),
});
