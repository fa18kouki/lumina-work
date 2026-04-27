-- =============================================
-- Store にバナー配列 (banner_urls) と GIF/動画配列 (animated_urls) を追加
-- 既存 banner_url は deprecated として残す (drop は別 PR)
-- =============================================

ALTER TABLE "stores"
  ADD COLUMN "banner_urls" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "animated_urls" TEXT[] NOT NULL DEFAULT '{}';

-- 旧 banner_url から banner_urls[0] への移行 (NULL でない既存値のみ)
UPDATE "stores"
SET "banner_urls" = ARRAY["banner_url"]
WHERE "banner_url" IS NOT NULL
  AND "banner_url" != ''
  AND array_length("banner_urls", 1) IS NULL;
