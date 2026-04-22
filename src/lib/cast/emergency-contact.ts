import { z } from "zod";

/**
 * 緊急連絡先の JSON 構造を表す zod スキーマ。
 * - relation / name / address / phone すべて optional（段階入力を許容）
 * - phone は数字・ハイフン・先頭の `+` のみ許容し、数字部分の長さは 10〜15 桁
 * - 空文字は「未入力」として許容する
 */
const PHONE_ALLOWED_CHARS = /^[+\d\-\s]*$/;

const phoneSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (value === undefined || value === "") return true;
    if (!PHONE_ALLOWED_CHARS.test(value)) return false;
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }, "電話番号は数字・ハイフン・+ 記号のみで 10〜15 桁で入力してください");

export const emergencyContactSchema = z.object({
  relation: z.string().max(50).optional(),
  name: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  phone: phoneSchema,
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
