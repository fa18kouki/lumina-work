-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('INTERVIEW_ONLY', 'TRIAL', 'EMPLOYED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "LivingArrangement" AS ENUM ('WITH_FAMILY', 'ALONE', 'OTHER');

-- CreateEnum
CREATE TYPE "Transportation" AS ENUM ('CAR', 'TRAIN', 'OTHER');

-- CreateEnum
CREATE TYPE "DressAvailability" AS ENUM ('OWNED', 'RENTAL');

-- AlterEnum
ALTER TYPE "AlcoholTolerance" ADD VALUE 'NG';

-- AlterTable
ALTER TABLE "casts" ADD COLUMN     "birthday_event_willingness" BOOLEAN,
ADD COLUMN     "blood_type" TEXT,
ADD COLUMN     "bust" INTEGER,
ADD COLUMN     "cast_email" TEXT,
ADD COLUMN     "cosmetic_surgery" TEXT,
ADD COLUMN     "cup_size" TEXT,
ADD COLUMN     "current_area" TEXT,
ADD COLUMN     "current_occupation" TEXT,
ADD COLUMN     "customer_count" INTEGER,
ADD COLUMN     "debt" TEXT,
ADD COLUMN     "dress_availability" "DressAvailability",
ADD COLUMN     "emergency_contact" JSONB,
ADD COLUMN     "employment_status" "EmploymentStatus",
ADD COLUMN     "facebook_id" TEXT,
ADD COLUMN     "family_approval" BOOLEAN,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "furigana" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "guarantee_period" TEXT,
ADD COLUMN     "guaranteed_hourly_rate" INTEGER,
ADD COLUMN     "has_boyfriend" BOOLEAN,
ADD COLUMN     "has_children" BOOLEAN,
ADD COLUMN     "has_husband" BOOLEAN,
ADD COLUMN     "has_tattoo" BOOLEAN,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "hip" INTEGER,
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "interview_date" TIMESTAMP(3),
ADD COLUMN     "language_skills" JSONB,
ADD COLUMN     "living_arrangement" "LivingArrangement",
ADD COLUMN     "medical_conditions" TEXT,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "needs_pickup" BOOLEAN,
ADD COLUMN     "pc_email" TEXT,
ADD COLUMN     "permanent_address" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "photo_publication_consent" BOOLEAN,
ADD COLUMN     "previous_store_performance" TEXT,
ADD COLUMN     "qualifications" TEXT,
ADD COLUMN     "sales_target" INTEGER,
ADD COLUMN     "shift_preferences" JSONB,
ADD COLUMN     "special_conditions" TEXT,
ADD COLUMN     "special_skills" TEXT,
ADD COLUMN     "store_preferences" TEXT,
ADD COLUMN     "tiktok_id" TEXT,
ADD COLUMN     "transportation" "Transportation",
ADD COLUMN     "trial_date" TIMESTAMP(3),
ADD COLUMN     "twitter_id" TEXT,
ADD COLUMN     "waist" INTEGER,
ADD COLUMN     "weight" INTEGER,
ADD COLUMN     "zodiac_sign" TEXT;

-- CreateTable
CREATE TABLE "cast_work_histories" (
    "id" TEXT NOT NULL,
    "cast_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "hourly_rate" INTEGER,
    "monthly_sales" INTEGER,
    "duration_months" INTEGER,
    "exit_date" TEXT,
    "exit_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cast_work_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cast_work_histories" ADD CONSTRAINT "cast_work_histories_cast_id_fkey" FOREIGN KEY ("cast_id") REFERENCES "casts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
