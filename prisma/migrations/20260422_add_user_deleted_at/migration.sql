-- =============================================
-- User ソフトデリートカラム追加
-- deletedAt NOT NULL のユーザーは退会済み扱い。
-- 既存メールで再登録できるように、重複チェックは deletedAt IS NULL で絞り込む。
-- RUN-247
-- =============================================

ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
