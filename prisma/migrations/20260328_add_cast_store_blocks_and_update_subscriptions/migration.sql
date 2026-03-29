-- AlterEnum: convert plan column to text, remap values, then create new enum
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE TEXT USING ("plan"::text);

-- Remap old values to new values
UPDATE "subscriptions" SET "plan" = 'CASUAL' WHERE "plan" = 'FREE';
UPDATE "subscriptions" SET "plan" = 'PRO_TRIAL' WHERE "plan" = 'BASIC';
UPDATE "subscriptions" SET "plan" = 'PRO_BUSINESS' WHERE "plan" = 'PREMIUM';

-- Drop old enum and create new one
DROP TYPE "SubscriptionPlan";
CREATE TYPE "SubscriptionPlan" AS ENUM ('CASUAL', 'PRO_TRIAL', 'PRO_BUSINESS', 'PRO_ENTERPRISE');

-- Cast text column back to new enum
ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE "SubscriptionPlan" USING ("plan"::"SubscriptionPlan");
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'CASUAL';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "offer_limit" INTEGER,
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cast_store_blocks" (
    "id" TEXT NOT NULL,
    "cast_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cast_store_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cast_store_blocks_store_id_idx" ON "cast_store_blocks"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "cast_store_blocks_cast_id_store_id_key" ON "cast_store_blocks"("cast_id", "store_id");

-- AddForeignKey
ALTER TABLE "cast_store_blocks" ADD CONSTRAINT "cast_store_blocks_cast_id_fkey" FOREIGN KEY ("cast_id") REFERENCES "casts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cast_store_blocks" ADD CONSTRAINT "cast_store_blocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
