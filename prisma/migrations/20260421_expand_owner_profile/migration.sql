-- =============================================
-- Owner モデルのプロフィール項目拡張
-- 代表者情報・法人/税務情報・請求先・請求担当者・本人確認ステータスを追加
-- すべて nullable（is_verified のみ default false）で非破壊
-- RUN-236
-- =============================================

-- 代表者情報
ALTER TABLE "owners" ADD COLUMN "representative_name" TEXT;
ALTER TABLE "owners" ADD COLUMN "representative_furigana" TEXT;
ALTER TABLE "owners" ADD COLUMN "representative_phone" TEXT;

-- 法人・税務情報
ALTER TABLE "owners" ADD COLUMN "corporate_number" TEXT;
ALTER TABLE "owners" ADD COLUMN "invoice_registration_number" TEXT;

-- 住所
ALTER TABLE "owners" ADD COLUMN "head_office_address" TEXT;
ALTER TABLE "owners" ADD COLUMN "billing_address" TEXT;

-- 請求担当者
ALTER TABLE "owners" ADD COLUMN "billing_contact_name" TEXT;
ALTER TABLE "owners" ADD COLUMN "billing_contact_email" TEXT;
ALTER TABLE "owners" ADD COLUMN "billing_contact_phone" TEXT;

-- 本人確認ステータス
ALTER TABLE "owners" ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;
