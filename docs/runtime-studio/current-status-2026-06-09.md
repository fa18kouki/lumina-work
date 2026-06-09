# Lumina 現状整理（2026-06-09）

## 正本

- ローカル開発ディレクトリ: `~/dev/lumina`
- GitHub: `https://github.com/fa18kouki/lumina-work`
- Vercel project: `runtime-studio/lumina-work`
- Production URL: `https://lumina-work.jp`
- Supabase project ref: `lsjilrrydfpzeaafwwqk`

## 実施した整理

1. `~/dev/lumina` の仮スケルトンを、GitHub の実装 repo `fa18kouki/lumina-work` に差し替え。
2. Vercel CLI で `runtime-studio/lumina-work` にリンク済み（`.vercel/` は git 管理外）。
3. Vercel Production 環境変数を `.env.local` に pull 済み（git 管理外、値は記録しない）。
4. 既存の仮メモは `docs/runtime-studio/` に退避。

## Vercel 環境変数（キー名のみ）

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_URL`
- `AUTH_SECRET`
- `AUTH_LINE_ID`
- `AUTH_LINE_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `STRIPE_*`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_API_KEY`

## 検証結果

- `bun install --frozen-lockfile`: 成功
- `bun run test --run`: 81 files / 642 tests passed
- `bunx tsc --noEmit`: 成功
- `bunx next build`: 成功

注意: `package.json` の `build` は `prisma migrate deploy && next build` のため、本番/共有DBに対する副作用を避ける目的で、ローカル検証では `bunx next build` を使用した。

## 次に開発指示を受けた時の流れ

1. `~/dev/PROJECTS.md` で Lumina の正本を確認。
2. `~/dev/lumina` でブランチを切る、または小変更なら main で作業。
3. Vercel/Supabase 環境は `.env.local` を使う。ただし秘密値は報告・コミットしない。
4. 変更後は最低限 `bun run test --run` / `bunx tsc --noEmit` / `bunx next build` を通す。
5. DB変更がある場合のみ、マイグレーションと対象環境を明示してから `prisma migrate deploy` を扱う。
