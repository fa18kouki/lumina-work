-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('PHONE', 'LINE', 'EMAIL');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "line_url" TEXT,
ADD COLUMN     "preferred_contact_method" "PreferredContactMethod";
