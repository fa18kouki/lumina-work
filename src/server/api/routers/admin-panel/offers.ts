import { z } from "zod";

import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import {
  dateRangeInput,
  interviewStatusEnum,
  offerStatusEnum,
  paginationInput,
} from "../admin/schemas";

const listInput = paginationInput.merge(dateRangeInput).extend({
  status: offerStatusEnum.optional(),
  castId: z.string().optional(),
  storeId: z.string().optional(),
});

/**
 * funnel が返す offer status の網羅順序。groupBy は欠落 status を返さないため、
 * UI 側で 0 を見せられるようサーバ側で 4 件揃えて返す。
 */
const OFFER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
const INTERVIEW_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;

type OfferStatus = (typeof OFFER_STATUSES)[number];
type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const adminOffersPanelRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ ctx, input }) => {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (input.dateFrom) createdAt.gte = new Date(input.dateFrom);
    if (input.dateTo) createdAt.lte = new Date(input.dateTo);
    const offers = await ctx.prisma.offer.findMany({
      where: {
        ...(input.status && { status: input.status }),
        ...(input.castId && { castId: input.castId }),
        ...(input.storeId && { storeId: input.storeId }),
        ...(Object.keys(createdAt).length > 0 && { createdAt }),
      },
      include: {
        cast: {
          select: {
            id: true,
            nickname: true,
            user: { select: { email: true } },
          },
        },
        store: {
          select: { id: true, name: true, area: true },
        },
        interviews: {
          select: { id: true, status: true, scheduledAt: true },
          orderBy: { scheduledAt: "desc" },
        },
      },
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | undefined;
    if (offers.length > input.limit) {
      const nextItem = offers.pop();
      nextCursor = nextItem?.id;
    }

    return { offers, nextCursor };
  }),

  funnel: adminPanelProcedure.query(async ({ ctx }) => {
    const [offerGroups, interviewGroups] = await Promise.all([
      ctx.prisma.offer.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      ctx.prisma.interview.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const offerCounts: Record<OfferStatus, number> = Object.fromEntries(
      OFFER_STATUSES.map((s) => [s, 0]),
    ) as Record<OfferStatus, number>;
    for (const g of offerGroups) {
      offerCounts[g.status as OfferStatus] = g._count._all;
    }

    const interviewCounts: Record<InterviewStatus, number> = Object.fromEntries(
      INTERVIEW_STATUSES.map((s) => [s, 0]),
    ) as Record<InterviewStatus, number>;
    for (const g of interviewGroups) {
      interviewCounts[g.status as InterviewStatus] = g._count._all;
    }

    const offerTotal = OFFER_STATUSES.reduce(
      (sum, s) => sum + offerCounts[s],
      0,
    );
    const interviewTotal = INTERVIEW_STATUSES.reduce(
      (sum, s) => sum + interviewCounts[s],
      0,
    );

    return {
      offerTotal,
      interviewTotal,
      offers: offerCounts,
      interviews: interviewCounts,
    };
  }),

  statusValues: adminPanelProcedure.query(() => ({
    offerStatuses: OFFER_STATUSES,
    interviewStatuses: INTERVIEW_STATUSES,
  })),

  byMatchTimeline: adminPanelProcedure
    .input(z.object({ offerId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const offer = await ctx.prisma.offer.findUnique({
        where: { id: input.offerId },
        include: {
          cast: {
            select: {
              id: true,
              nickname: true,
              user: { select: { email: true } },
            },
          },
          store: { select: { id: true, name: true, area: true } },
          interviews: {
            select: {
              id: true,
              status: true,
              scheduledAt: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { scheduledAt: "asc" },
          },
        },
      });
      if (!offer) {
        return null;
      }
      const match = await ctx.prisma.match.findFirst({
        where: { castId: offer.castId, storeId: offer.storeId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
      });
      return { offer, match };
    }),
});
