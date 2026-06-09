-- 管理者が契約ごとに毎月請求する金額を調整できるようにする
ALTER TABLE "subscriptions" ADD COLUMN "custom_monthly_price_jpy" INTEGER;
