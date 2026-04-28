-- =============================================
-- Owner / Store ソフトデリートカラム追加
-- オーナー退会時に User.deletedAt とあわせて Owner.deletedAt をセットする。
-- Store.deletedAt は退会オーナー配下の店舗をキャストから不可視にするために使う。
-- 既存データに影響しない additive 変更（NULL 許容、デフォルトなし）。
-- =============================================

ALTER TABLE "owners" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "owners_deleted_at_idx" ON "owners"("deleted_at");

ALTER TABLE "stores" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "stores_deleted_at_idx" ON "stores"("deleted_at");
