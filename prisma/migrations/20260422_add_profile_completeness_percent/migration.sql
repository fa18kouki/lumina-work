-- =============================================
-- Cast にプロフィール充実度パーセントを永続化
-- upsertProfile 時にサーバ側で再計算して保存する。
-- RUN-249
-- =============================================

ALTER TABLE "casts"
ADD COLUMN "profile_completeness_percent" INTEGER NOT NULL DEFAULT 0;
