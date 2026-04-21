-- =============================================
-- Invoice の Subscription への外部キーを ON DELETE CASCADE から RESTRICT へ変更
-- 会計証跡として Invoice を Subscription 削除で消さないようにする。
-- Subscription を消したい場合は Invoice を先にアーカイブ/移管する運用へ。
-- RUN-239
-- =============================================

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_subscription_id_fkey";

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
