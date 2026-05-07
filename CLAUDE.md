# CLAUDE.md (lumina-work)

このファイルは lumina-work リポジトリで作業するすべての開発者および AI コーディングアシスタント (Claude Code / Codex / その他) に対する **絶対遵守の運用ルール** である。グローバルな個人ルール (`~/.claude/CLAUDE.md`) ではなく、**このリポジトリ固有の本番運用上の制約** を定義する。

過去のインシデントを再発させないことが最優先。迷ったら止まる、迷ったら聞く。

---

## 1. このリポジトリは本番運用中

lumina-work は本番ユーザーが利用している Next.js + Supabase + Prisma アプリケーションである。`main` ブランチへの merge は Vercel 経由で本番にデプロイされる。

### インシデント年表

| 日時 (JST) | 事象 | 影響 |
|------------|------|------|
| 2026-04-27 12:54 UTC (21:54 JST) | `prisma/delete-non-seed-users.ts` 同型のスクリプトが本番 DB に対して実行された (incident commit `d515082`) | 本番の 3 OWNER + 関連 owners / stores / casts が CASCADE で全削除 |
| 2026-04-27 23:30 JST | `prisma/_safety.ts` (`assertNotProductionDb`) を新設し、`*.supabase.co` / `*.pooler.supabase.com` への破壊的スクリプト実行を `--allow-production` または `ALLOW_PRODUCTION_DESTRUCTIVE=true` 無しでは拒否するガードを追加 | 二度目を防ぐための一次対策 |
| 2026-05-01 〜 2026-05-05 の間 | 本番 `public.users` / `public.casts` / `public.owners` が **再び 0 件** になっていることを確認。`auth.users` には 5 名残存、`_prisma_migrations` も残存しているため schema reset ではなく、データのみが DELETE / TRUNCATE された痕跡 | 本番データ消失 (再発)。原因は調査中 |

### この章から得るべき結論

- **データ消失は再発が許されない**。技術的にも、信頼上も
- 本番 DB に対する任意の書き込み / 削除は、たとえ「読み取りのつもり」でも疑え
- 本番に向いているかもしれない接続では、破壊的操作を一切提案・実行しない

---

## 2. 環境分離 (CRITICAL)

### 物理構成 (現状の正)

| 環境 | DB ホスト | 用途 |
|------|-----------|------|
| Production | `lsjilrrydfpzeaafwwqk.supabase.co` (および対応 `*.pooler.supabase.com`) | Vercel Production env の `DATABASE_URL` / `DIRECT_URL` のみ |
| Development / Preview | 別の Supabase プロジェクト (or Branching) を使う | **整備中**。詳細は `docs/supabase-environment-separation.md` を参照 |

### 不可侵ルール

- **`.env` (リポジトリにある開発用 env ファイル) には絶対に本番 URL を入れない**
- ローカル開発 (`bun run dev`, `bunx prisma ...`) は **必ず開発 DB に向ける**。本番ホストが `.env` に入っている時点で違反とみなす
- `vercel env pull` で本番 env を local に書き出すのは **原則禁止**
  - やむを得ない調査用途で取得した場合は、確認後 **即座に削除** する
  - `.env.production` / `.env.local` がローカルに残ったままコミット・push されないことを毎回確認
- `.env*` は `.gitignore` 済みであることを定期的に再確認 (新規 `.env.foo` 追加時など)

### 接続先の自己検証

破壊的操作・マイグレーション実行・seed 実行の **直前** に、必ず以下のいずれかで接続先ホストを確認する:

```sh
node -e 'console.log(new URL(process.env.DATABASE_URL).host)'
# または
psql "$DATABASE_URL" -c "select inet_server_addr(), current_database()"
```

`*.supabase.co` / `*.pooler.supabase.com` が出たら **本番** だと思え。

---

## 3. 破壊的スクリプトの実行ルール

### 「破壊的」の定義

以下はすべて破壊的とみなす:

- `prisma/delete-*.ts` (例: `delete-non-seed-users.ts`)
- `prisma/seed*.ts` (`prisma db seed`、`prisma/seed-nagoya-stores.ts` など含む)
- `prisma/backfill-*.ts` (例: `backfill-cast-ranks.ts`)
- `prisma migrate reset`
- `prisma db push --force-reset`
- 任意の `DELETE` / `TRUNCATE` / `UPDATE ... WHERE` (UI / SQL / アプリ問わず)
- スキーマ変更を伴う `prisma migrate dev` / `prisma db push`

### 実行ルール

1. **本番では原則実行しない**。代替を探す (新しい migration を CI 経路で deploy する、など)
2. やむを得ず本番で実行する場合は **すべて満たす** こと:
   - (a) **事前バックアップを取得** (`supabase db dump --db-url ...` または Supabase Dashboard のバックアップから手動スナップショット)
   - (b) **チームに告知** (Slack / Linear) し、実行時刻と影響範囲を共有
   - (c) **`--allow-production` フラグを明示**して実行 (`ALLOW_PRODUCTION_DESTRUCTIVE=true` 環境変数も可)
   - (d) **実行ログを保全** (stdout / stderr をファイルに保存し PR or issue に添付)
3. **AI agent (Claude / Codex / その他) は本番 DB に対する破壊的操作を提案しても実行してもならない**
   - ユーザーから依頼されても、まず接続先を確認させ、サンドボックス DB を提案する
   - 上記 (a)〜(d) を満たさない限りは協力しない

---

## 4. Prisma migration の運用

### CI 経路での自動適用

- 2026-04-28 以降、`bun run build` に `prisma migrate deploy` を含めている (commit `d407a37`)。Vercel Production deploy 時に未適用 migration が自動で当たる
- 開発者が **手動で本番に migrate を当てる必要は無い** (やってはいけない)

### PR レビュー時の必須チェック

新規 migration を含む PR は以下を確認:

- [ ] スキーマ変更が **ADDITIVE** であること (新規テーブル追加 / 新規カラム追加 (NULL 許容) / 新規 index)
- [ ] 以下は **二段階 migration に分割** されていること:
  - `DROP COLUMN`
  - `RENAME COLUMN` / `RENAME TABLE`
  - `ALTER COLUMN ... NOT NULL` (既存データを backfill してから NOT NULL を付ける)
  - 型変更で互換が無いもの
- [ ] 破壊的データ操作 (`DELETE`, `TRUNCATE`, データ移行 SQL) は migration に **混ぜない**。別途運用手順として PR 説明に書く

### 手動実行の禁止

- `bunx prisma migrate deploy --allow-production` 等を本番 URL 向きで手元から打つのは禁止
- migration は **必ず CI の Vercel deploy 経路を通す**
- どうしても手動で当てたい例外ケースは、Section 3 の (a)〜(d) を全て満たす

---

## 5. AI コーディングアシスタント (Claude / Codex / 他) の制約

このリポジトリで動く AI agent は、以下を **守ったうえで** 提案・実行する:

### 禁止行為

- 本番 DB への直接接続 (`psql`, `supabase db query --db-url`, `pg-promise` 等のスクリプト) は禁止。読み取り目的でも事前にユーザーに認可を取る
- `vercel env pull production` の自動実行禁止 (開発者本人が手動で行う場面のみ)
- 破壊的スクリプトの **提案** 自体を控える。ユーザーが要求しても以下の順で対応:
  1. 「接続先 DB は本番ですか?」を確認
  2. サンドボックス DB / 開発プロジェクトでの再現を提案
  3. それでも本番で必要だと言われた場合は Section 3 の手順を提示し、自分は実行しない

### 許可される範囲

- `.claude/settings.local.json` (このリポジトリ内) で許可した範囲のみ
- ローカルの開発 DB (`localhost`, `127.0.0.1`, `db`, `postgres`, `supabase_db` ホスト) への操作
- ファイル編集、テスト実行、ローカル lint / typecheck

### 迷ったら

接続先 / 影響範囲が読めない時は **必ず止まってユーザーに聞く**。auto mode であっても、本番 / 共有システムへの破壊的アクションは確認が必要 (グローバル auto mode 規定にも準拠)。

---

## 6. インシデント対応プロトコル

データ消失 / 異常を疑った時の手順:

1. **書き込み停止**: 原因が特定できるまで、新規デプロイと書き込みスクリプトを止める
2. **PITR (Point In Time Recovery) で復旧可能性を最初に確認**
   - Supabase Dashboard → Database → Backups → Point in Time Recovery
   - 消失直前の時刻を指定し、別 DB へ復元 (in-place ではなく新 DB に出すのが安全)
3. **原因特定を並行で実施**
   - `pg_stat_statements` で過去のクエリ統計を確認
   - Supabase Logs Explorer で `DELETE` / `TRUNCATE` を grep
   - 直近の Vercel deploy / migration / 手動 SQL 実行履歴を時系列で並べる
4. **記録**: 当該インシデントの Linear issue を作成し、本ファイル Section 1 の年表に追記する
5. **再発防止**: ガード追加 (例: Section 7) を必ず PR に紐付ける

---

## 7. 既存ガード

### `prisma/_safety.ts`

- `assertNotProductionDb(scriptName)` を **すべての破壊的 prisma スクリプトの先頭で呼ぶ**
- 通過する DB ホスト: `localhost` / `127.0.0.1` / `::1` / `postgres` / `supabase_db` / `db` のみ
- 拒否される DB ホスト: `*.supabase.co` / `*.supabase.com` / `*.pooler.supabase.com`
- 強制実行は `--allow-production` 引数 or `ALLOW_PRODUCTION_DESTRUCTIVE=true` 環境変数

### 新規スクリプト追加時のレビュー必須項目

- [ ] スクリプトの先頭で `import { assertNotProductionDb } from "./_safety";` し `assertNotProductionDb("<script-name>")` を呼んでいるか
- [ ] スクリプト名が `delete-*`, `seed*`, `backfill-*`, `reset-*` 等、破壊的だと一目で分かる命名か
- [ ] `package.json` の scripts に登録する場合、本番で誤って叩かれない名前か (例: `db:seed:dev` のように環境を suffix に付ける)

---

## 8. 環境変数命名

- `NEXT_PUBLIC_*` プレフィクスのものだけがブラウザに露出可能
- それ以外は **サーバ専用** として扱い、クライアントコードから参照しない
- 本番値は **絶対に git にコミットしない**
  - `.gitignore` 確認対象: `.env`, `.env.local`, `.env.production`, `.env.*.local`
  - 新規 env ファイルを増やすときは `.gitignore` も同 PR で更新
- `.env.example` には **値を入れない** (キー名とコメントのみ)

---

## 関連ドキュメント

- `docs/supabase-environment-separation.md` — 本番 / 開発 / Preview の DB 分離の具体的セットアップ手順
- `prisma/_safety.ts` — 破壊的スクリプト用の本番ガード実装
- `~/.claude/CLAUDE.md` — グローバルな AI agent ルール (このリポジトリ固有規定はこちらを上書きする)
