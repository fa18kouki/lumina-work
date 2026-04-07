-- 既存オーナーにデフォルト FREE サブスクリプションをバックフィル
INSERT INTO "subscriptions" ("id", "owner_id", "plan", "status", "offer_limit", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  o."id",
  'FREE',
  'ACTIVE',
  3,
  NOW(),
  NOW()
FROM "owners" o
WHERE NOT EXISTS (
  SELECT 1 FROM "subscriptions" s WHERE s."owner_id" = o."id"
);

-- CAST ロールのユーザーにデフォルト Cast レコードをバックフィル
INSERT INTO "casts" (
  "id", "user_id", "nickname", "age", "photos", "desired_areas",
  "preferred_atmosphere", "preferred_clientele", "is_available_now",
  "id_verified", "id_verification_status", "rank", "penalty_count",
  "is_suspended", "diagnosis_completed", "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  u."id",
  'ゲスト',
  18,
  '{}',
  '{}',
  '{}',
  '{}',
  true,
  false,
  'PENDING',
  'C',
  0,
  false,
  false,
  NOW(),
  NOW()
FROM "users" u
WHERE u."role" = 'CAST'
  AND NOT EXISTS (
    SELECT 1 FROM "casts" c WHERE c."user_id" = u."id"
  );
