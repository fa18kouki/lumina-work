-- =============================================
-- SubscriptionPlanConfig マスタ新設
-- 各 SubscriptionPlan (FREE/CASUAL/PRO_TRIAL/...) の表示名・上限・
-- 月額料金・Stripe Price ID を集約する。
-- Subscription.offerLimit / max_stores は後方互換のため残し、
-- Subscription.plan_config_id で新マスタを参照する段階移行とする。
-- RUN-237
-- =============================================

CREATE TABLE "subscription_plan_configs" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "display_name" TEXT NOT NULL,
    "offer_limit" INTEGER,
    "max_stores" INTEGER,
    "monthly_price_jpy" INTEGER NOT NULL DEFAULT 0,
    "stripe_price_id" TEXT,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plan_configs_plan_key"
    ON "subscription_plan_configs"("plan");

CREATE UNIQUE INDEX "subscription_plan_configs_stripe_price_id_key"
    ON "subscription_plan_configs"("stripe_price_id");

-- subscriptions に planConfig への optional FK を追加
ALTER TABLE "subscriptions" ADD COLUMN "plan_config_id" TEXT;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_config_id_fkey"
    FOREIGN KEY ("plan_config_id") REFERENCES "subscription_plan_configs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
