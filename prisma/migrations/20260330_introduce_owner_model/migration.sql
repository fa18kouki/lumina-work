-- =============================================
-- オーナーモデル導入マイグレーション
-- STORE ロールを OWNER に変更し、Owner モデルを介して
-- 1人のオーナーが複数店舗を管理できるようにする
-- =============================================

-- 1. owners テーブル作成
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "owners_user_id_key" ON "owners"("user_id");

-- 2. UserRole enum: STORE → OWNER
ALTER TYPE "UserRole" RENAME VALUE 'STORE' TO 'OWNER';

-- 3. 既存 STORE ユーザーごとに Owner レコードを作成
INSERT INTO "owners" ("id", "user_id", "updated_at")
SELECT
    gen_random_uuid()::text,
    u."id",
    NOW()
FROM "users" u
WHERE u."role" = 'OWNER';

-- 4. stores テーブルに owner_id カラム追加（nullable）
ALTER TABLE "stores" ADD COLUMN "owner_id" TEXT;

-- 5. 既存 stores の owner_id を、user_id 経由で owners にマッピング
UPDATE "stores" s
SET "owner_id" = o."id"
FROM "owners" o
WHERE o."user_id" = s."user_id";

-- 6. owner_id を NOT NULL に
ALTER TABLE "stores" ALTER COLUMN "owner_id" SET NOT NULL;

-- 7. stores から user_id カラムとそのユニーク制約を削除
ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "stores_user_id_key";
ALTER TABLE "stores" DROP COLUMN "user_id";

-- 8. stores に owner_id の外部キー追加
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. subscriptions テーブルに owner_id カラム追加（nullable）
ALTER TABLE "subscriptions" ADD COLUMN "owner_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "max_stores" INTEGER;

-- 10. 既存 subscriptions の owner_id を、store_id 経由でマッピング
UPDATE "subscriptions" sub
SET "owner_id" = s."owner_id"
FROM "stores" s
WHERE s."id" = sub."store_id";

-- 11. owner_id を NOT NULL に
ALTER TABLE "subscriptions" ALTER COLUMN "owner_id" SET NOT NULL;

-- 12. subscriptions から store_id カラムとその制約を削除
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_store_id_fkey";
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_store_id_key";
ALTER TABLE "subscriptions" DROP COLUMN "store_id";

-- 13. subscriptions に owner_id のユニーク制約と外部キー追加
CREATE UNIQUE INDEX "subscriptions_owner_id_key" ON "subscriptions"("owner_id");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 14. owners に user_id の外部キー追加
ALTER TABLE "owners" ADD CONSTRAINT "owners_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
