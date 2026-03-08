import { z } from "zod";

/**
 * ページネーション共通スキーマ
 */
export const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

/**
 * 日付範囲フィルター
 */
export const dateRangeInput = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

/**
 * Enum スキーマ
 */
export const userRoleEnum = z.enum(["CAST", "STORE", "ADMIN"]);
export const castRankEnum = z.enum(["C", "B", "A", "S"]);
export const matchStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export const offerStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);
export const interviewStatusEnum = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);
export const penaltyTypeEnum = z.enum([
  "NO_SHOW",
  "INAPPROPRIATE_CONTENT",
  "SPAM",
  "OTHER",
]);
