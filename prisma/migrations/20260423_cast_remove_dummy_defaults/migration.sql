-- =============================================
-- Cast のダミー初期値 (nickname='ゲスト', age=18, is_available_now=true) を廃止
-- 初回ログイン時に未設定のまま Cast を作り、本人が診断 or 編集で値を埋めるまで
-- null/空に留める。OWNER 側検索には nickname/age 非空フィルタを入れて露出させない。
-- RUN-258
-- =============================================

ALTER TABLE "casts" ALTER COLUMN "age" DROP NOT NULL;
ALTER TABLE "casts" ALTER COLUMN "is_available_now" SET DEFAULT false;

-- 既存の「アプリ未入力と推定できる」行(診断未完了 かつ 更新履歴なし)だけを null/空に戻す。
-- 本物のユーザーが偶然「ゲスト 18 歳」で登録していたケースを巻き込まないよう条件を厳しくする。
UPDATE "casts"
SET "age" = NULL,
    "nickname" = '',
    "is_available_now" = false
WHERE "nickname" = 'ゲスト'
  AND "age" = 18
  AND "diagnosis_completed" = false
  AND "updated_at" = "created_at";
