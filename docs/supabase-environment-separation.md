# Supabase 環境分離セットアップ手順

lumina-work における本番 / 開発 / Preview の DB 分離を、物理的な別 Supabase プロジェクトで実現するための手順書。

---

## 概要

### 現状の課題

- 本番 Supabase (`lsjilrrydfpzeaafwwqk.supabase.co`) と開発・Preview 環境の DB が **物理的に同一** または不分離になっており、ローカル開発・スクリプト実行が誤って本番を触るリスクが残っている
- 2026-04-27 のインシデント (本番 OWNER 全削除) と、2026-05-01〜05 のデータ消失事象は、いずれも「本番 DB が破壊的スクリプトから到達可能」だったことが背景にある
- `.env` の `DATABASE_URL` が本番を指しているケースが疑われ、Vercel 側で env を分けていてもローカルからの接続が本番に向くと意味がない

### 目標

- **本番 / 開発 / Preview の 3 環境で、DB を物理的に別プロジェクトに分ける**
- ローカル開発と Preview デプロイは、本番 DB に **接続できない** ようにする
- 本番 URL は Vercel Production env と、限られたチームメンバーのパスワードマネージャ内のみに存在する状態を作る

### 選択肢比較

| 観点 | 別プロジェクト方式 (推奨) | Supabase Branching |
|------|---------------------------|--------------------|
| プラン要件 | Free でも可 | **Pro 以上必須** |
| 物理分離 | 完全 (別 project ID, 別 host) | 同一 project 配下の branch DB |
| git branch 連携 | 手動 | 自動 (PR ごとに preview branch) |
| コスト | プロジェクトを増やす分のみ | Pro プラン課金 |
| 学習コスト | 低 (普段の Supabase と同じ) | 中 (Branching CLI / Dashboard 操作) |
| 本件への適合度 | **高** (まず分離が目的) | 中 (Preview 自動化までやるなら強い) |

---

## 推奨案: 別プロジェクト方式

### 構成

| 環境 | Supabase プロジェクト | DB host (例) | Vercel env scope |
|------|------------------------|--------------|-------------------|
| Production | `lumina-work` (既存) | `lsjilrrydfpzeaafwwqk.supabase.co` | Production |
| Development / Preview | `lumina-work-dev` (新規) | `<new-ref>.supabase.co` | Development, Preview |
| ローカル | `lumina-work-dev` または `supabase start` のローカル DB | `<new-ref>.supabase.co` または `localhost:54322` | (`.env` ローカル) |

### 流れ

1. Supabase Dashboard で `lumina-work-dev` プロジェクトを新規作成
2. 既存の `prisma/migrations` を新プロジェクトに `prisma migrate deploy` で適用
3. 開発用 seed (`prisma/seed.ts` など) を投入
4. Vercel CLI で Development / Preview env を **新プロジェクトの URL** に切替
5. ローカル `.env` を新プロジェクト URL に書き換え、リポジトリ管理用に `.env.example` を整備
6. 既存 `.env` の本番値を全削除し、本番 URL は Vercel Production env のみに残す

---

## 別案: Supabase Branching (Pro 必須)

git branch ごとに自動で preview DB が立ち上がる方式。Vercel の Preview deploy と相性が良いが、Free プランでは使えない。

### 概略

1. `lumina-work` プロジェクト (Pro) で Branching を有効化
2. PR を作ると preview branch DB が自動作成される
3. `supabase branches list` で確認、`supabase branches delete <ref>` で個別削除
4. 本番 main branch は従来通り `lsjilrrydfpzeaafwwqk.supabase.co`

### 注意

- migration の preview branch への適用ルールを Supabase Dashboard で設定する必要あり
- Free プラン (現状) では使えないため、まずは「別プロジェクト方式」で分離してから、必要に応じて Pro 化と Branching への移行を検討

---

## 手順 (別プロジェクト方式・具体)

以下は **チームメンバー 1 名が代表で実施** することを想定。完了後、他メンバーは「ローカル `.env` の差し替え」だけ行う。

### 1. Supabase Dashboard で新規プロジェクト作成

- 名前: `lumina-work-dev`
- リージョン: 本番と同じ (Tokyo / `ap-northeast-1` 等)
- DB password を生成 (1Password 等のチーム保管庫に保存)
- 作成後の DB host (例: `xxxxxxxx.supabase.co`) と connection string を控える

### 2. 新プロジェクトに migration を適用

ローカルから新プロジェクトを向いて `migrate deploy` を実行する (新プロジェクトは空なので破壊的でない):

```sh
# 一時的に開発用 URL を環境変数として渡す。 .env には書かない
DATABASE_URL='postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres' \
DIRECT_URL='postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres' \
  bunx prisma migrate deploy
```

完了後、`prisma/migrations` 全件が新プロジェクトの `_prisma_migrations` テーブルに記録されていることを確認。

### 3. 開発用 seed を投入

```sh
DATABASE_URL='postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres' \
DIRECT_URL='postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres' \
  bunx prisma db seed
```

`prisma/_safety.ts` は `*.supabase.co` を block するため、必要なら一時的に `--allow-production` を付ける (新プロジェクトは本番ではないが、ホスト名上は supabase-remote と判定されるため)。

> 補足: 中長期的には `_safety.ts` を「許可リスト方式」(本番プロジェクト ref をブロック) に拡張する PR を別途検討。

### 4. Vercel CLI で env を切替

```sh
# 古い値の削除
vercel env rm DATABASE_URL development
vercel env rm DATABASE_URL preview
vercel env rm DIRECT_URL development
vercel env rm DIRECT_URL preview

# 新規追加 (新プロジェクトの URL を入力)
vercel env add DATABASE_URL development
vercel env add DATABASE_URL preview
vercel env add DIRECT_URL development
vercel env add DIRECT_URL preview
```

Production env は **絶対に触らない**。`vercel env ls` で Production / Development / Preview の値が独立していることを目視確認。

### 5. ローカル `.env` の差し替え

- 既存の `.env` を開き、本番 URL が含まれていたら全削除
- 新プロジェクトの URL に書き換える
- `.env.example` を更新 (キー名とコメントのみ、値は空)

```sh
# .env (ローカル、コミットしない)
DATABASE_URL=postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres
DIRECT_URL=postgres://postgres:<password>@<new-ref>.supabase.co:5432/postgres
```

### 6. schema 同期検証

```sh
bunx prisma db pull --print
# あるいは
bunx prisma migrate status
```

新プロジェクトのスキーマが `prisma/schema.prisma` と一致していることを確認。差分があれば `prisma migrate deploy` を再実行。

---

## 検証チェックリスト

切替完了後、以下をすべて確認する:

- [ ] `vercel env ls` で `DATABASE_URL` の Production / Development / Preview の **値が異なる** こと (host が別)
- [ ] Production env の `DATABASE_URL` host が `lsjilrrydfpzeaafwwqk.supabase.co` のみ
- [ ] Development / Preview env の `DATABASE_URL` host が新プロジェクトの ref であること
- [ ] ローカルから `psql "$DATABASE_URL" -c "select current_database(), inet_server_addr()"` で **新プロジェクト** に接続されること
- [ ] `supabase projects list` の linked プロジェクトが `lumina-work-dev` を指していること (`supabase link --project-ref <new-ref>` で切替)
- [ ] 本番 URL がローカル `.env*` ファイルに **一切含まれていない** こと (`grep lsjilrrydfpzeaafwwqk .env*` で 0 件)
- [ ] `.env*` が `.gitignore` 済みで、git にコミットされていないこと (`git ls-files | grep '\.env'` で `.env.example` 以外が出ないこと)
- [ ] Vercel Preview deploy を 1 件作って動作確認 (新 DB に書き込み・読み取りできるか)
- [ ] 本番 deploy を 1 件回して、引き続き本番 DB に正常接続できること

---

## ロールバック手順

切替に問題が出た場合の戻し手順:

1. Vercel CLI で Development / Preview env を旧値 (本番 URL ではない、切替前の値) に戻す
   ```sh
   vercel env rm DATABASE_URL development
   vercel env rm DATABASE_URL preview
   vercel env add DATABASE_URL development   # 旧値を入力
   vercel env add DATABASE_URL preview       # 旧値を入力
   ```
2. ローカル `.env` を切替前の状態に戻す
3. 新規作成した `lumina-work-dev` プロジェクトは **そのまま破棄** で問題なし (本番影響なし)
4. インシデント記録として、何が原因で戻したかを Linear に残し、`CLAUDE.md` の年表に必要なら追記

ロールバック中も **本番 env (`DATABASE_URL` Production) は絶対に触らない**。

---

## 関連

- `/CLAUDE.md` — リポジトリ固有の本番運用ルール (本ドキュメントの上位規定)
- `prisma/_safety.ts` — 破壊的スクリプトの本番ガード
- Supabase Docs: https://supabase.com/docs/guides/platform/branching (Branching 方式に進む場合)
