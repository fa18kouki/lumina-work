# 管理画面 (admin.<host>) セットアップ手順

lumina-work の管理画面と、Resend × Supabase Auth を使った店舗オーナー招待フローの手順書。
コードは `feature: admin-panel-user-invites` ブランチで段階的に追加されている。

---

## 1. 全体像

```
                       ┌─────────────────────────────┐
admin.<本番ドメイン> ─►│  Next.js middleware (Node)  │
                       │  host=admin.* なら           │
                       │  /admin/* に internal rewrite│
                       └────────────┬────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
            /admin/login                         /admin/invites
            (cookie 未取得 OK)                    (要 admin-session cookie)
                  │                                   │
                  └──────POST /api/admin/auth─────────┘
                            │
                            └─ ADMIN_API_KEY を timing-safe 検証
                            └─ HMAC 署名つき cookie admin-session を 24h 発行

招待作成 (admin パネル) ──► Supabase auth.admin.inviteUserByEmail(email, {redirectTo})
                                  │
                                  └─ Supabase が招待メールを生成
                                  └─ Resend SMTP 経由で配送
                                        │
                                        ▼
                                  メール受信 → リンククリック
                                        │
                                        ▼
                  /api/auth/callback?next=/o/dashboard で受け止め:
                    1. PKCE code を session に交換
                    2. Prisma User + Owner + Subscription を冪等 provision
                    3. AdminInvitation を ACCEPTED にマーク (best-effort)
                                        │
                                        ▼
                                  /o/dashboard へ
```

副次効果として、既存の `/o/register` 確認メール・`/o/forgot-password` リセットメールも
Supabase SMTP 経由で **すべて Resend から送信される** ようになる。テンプレートとブランドが統一される。

---

## 2. 環境変数

`.env` (ローカル) と Vercel Production env に以下を追加する。

| 変数 | 用途 | 例 |
|------|------|-----|
| `ADMIN_API_KEY` | 管理画面ログイン用 + admin-session cookie の HMAC 署名鍵 | `openssl rand -base64 48` で生成 |

`RESEND_API_KEY` は **アプリ内** と **Supabase SMTP 設定** の両方で使う。

- アプリ内: `src/lib/resend.ts` が Resend SDK を初期化し、通知メール (オファー / 面接 / 招待など) を直接送る
- Supabase SMTP: Supabase Auth (magic link 等) の送信に同じキーを Supabase の SMTP パスワード欄に貼り付ける (詳細は §4)

> ⚠️ 同じキーを 2 系統で使い回すため、漏洩時の影響範囲が広い。Vercel env と Supabase ダッシュボード以外には保存しない。
>
> ⚠️ ローカル開発で実際にメールを送る場合、Supabase Auth は Supabase プロジェクト単位の SMTP 設定を共有する。
> 開発 Supabase プロジェクトには dev 用 Resend キーを別途発行し、本番キーを開発に流用しない。

---

## 3. Resend 側の準備

### 3.1 アカウント作成 + ドメイン追加

1. https://resend.com/signup でアカウント作成
2. Dashboard → Domains → **Add Domain**
3. 送信元用サブドメインを入力 (例: `mail.lumina-work.jp`)
   - bare ドメイン (例: `lumina-work.jp`) を使うと SPF/DKIM の干渉リスクがあるためサブドメイン推奨
4. 表示された TXT レコード (SPF + DKIM、必要に応じて DMARC) を DNS に追加
   - Cloudflare / Route53 / Value Domain など、運用中の DNS プロバイダで設定
   - DMARC は任意だが本番では `p=none` から始めて段階的に強化することを推奨
5. Resend の Verify ボタンで検証 (通常数分〜数時間、最大 72h)

### 3.2 API キー発行

1. Dashboard → API Keys → **Create API Key**
2. 名称: `lumina-work-supabase-smtp-production` (環境ごとに分ける)
3. 権限: Send access を最低限付与
4. 表示された `re_xxx` を控える (Supabase 側に貼り付ける)

### 3.3 (任意) From アドレスの決定

Supabase 招待メールの From は Supabase 側 SMTP 設定の Sender Email に従う。
本番では `noreply@mail.lumina-work.jp` 等の **検証済みドメインのアドレス** を使う。

---

## 4. Supabase 側の SMTP 設定

1. Supabase Dashboard → 対象プロジェクト → **Authentication → SMTP Settings**
2. **Enable Custom SMTP** を ON
3. 以下を入力:
   - Sender email: `noreply@mail.lumina-work.jp`
   - Sender name: `LUMINA`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: §3.2 で発行した `re_xxx`
   - Minimum interval between emails: 60 (デフォルト)
4. **Save** で保存
5. Authentication → Email Templates → **Invite User** を開き、日本語で書き換える
   - 件名例: `LUMINA からの招待 / アカウントを作成してください`
   - 本文は Liquid シンタックス。`{{ .ConfirmationURL }}` が招待リンクに展開される
   - サンプル本文は §7 を参照

> Liquid テンプレートは React Email のような柔軟性は無い。
> 高度なブランドデザインが必要になったら本ドキュメント §8 (将来の代替案) を参照。

---

## 5. アプリ側のフロー (実装は次フェーズ)

| Phase | 内容 | 完了状況 |
|-------|------|-----------|
| 1 | サブドメイン rewrite (`admin.<host>` → `/admin/*`) | ✅ |
| 2 | `ADMIN_API_KEY` 認証 + cookie セッション | ✅ |
| 3 | 本ドキュメント (Resend × Supabase SMTP 手順書) | ✅ |
| 4 | Prisma `AdminInvitation` モデル追加 | ✅ |
| 5 | tRPC `adminInvite` router (list / create / resend / revoke) | ✅ |
| 6 | 管理画面 UI (一覧 + 招待モーダル) | ✅ |
| 7 | 招待受諾フロー (既存 `/api/auth/callback` を再利用 + AdminInvitation ACCEPTED マーク) | ✅ |
| 8 | テスト追加 (unit / integration) | ✅ (Playwright E2E は別タスク) |
| 9 | Vercel デプロイ手順 (admin サブドメイン追加 + DNS) | ✅ §9 を参照 |

---

## 6. ローカル開発手順

### 6.1 admin サブドメインの解決

`admin.localhost:3000` はモダンブラウザ (Chrome / Firefox / Safari) が自動で `127.0.0.1`
に解決するため、`/etc/hosts` への追記は **不要**。

確認:
```sh
curl -I http://admin.localhost:3000/  # /admin/login にリダイレクトされる想定
```

### 6.2 ADMIN_API_KEY のセット

```sh
openssl rand -base64 48
# 出力された値を .env の ADMIN_API_KEY= に貼り付け
```

### 6.3 dev サーバ起動

ユーザーが手動で起動 (CLAUDE.md ローカルルール準拠)。
コーディング AI は `bun run dev` を実行しない。

### 6.4 動作確認 (Phase 2 までの状態)

| URL | 期待動作 |
|-----|----------|
| `admin.localhost:3000/` | `/login` にリダイレクト |
| `admin.localhost:3000/login` | ログインフォーム表示 |
| `localhost:3000/admin` | 404 (admin パスは subdomain 経由でのみ) |
| `localhost:3000/admin/login` | 404 |

---

## 7. Supabase 招待メールテンプレ例 (Liquid)

```html
<h2>LUMINA からの招待</h2>

<p>{{ .Email }} 様</p>

<p>
  LUMINA の店舗オーナーアカウントが作成されました。
  下記のリンクをクリックして、ログインを完了してください。
</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;
            text-decoration:none;border-radius:6px;">
    アカウントを有効化する
  </a>
</p>

<p style="color:#64748b;font-size:13px;">
  このリンクは 24 時間有効です。
  心当たりがない場合はこのメールを破棄してください。
</p>

<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />

<p style="color:#94a3b8;font-size:12px;">
  LUMINA - キャストと店舗をつなぐ募集情報提供サービス<br />
  &copy; 2026 LUMINA
</p>
```

`{{ .ConfirmationURL }}` は Supabase が `redirectTo` で指定した URL
(本件では `https://<本番ドメイン>/o/invite/callback`) を内包する署名つきリンクに展開される。

---

## 8. 将来の代替案 (参考)

Liquid テンプレートでは表現に限界がある / 送達状態を細かく追いたい、となった場合は
独自招待フローへの移行を検討する。

| 比較項目 | 現方式 (Supabase + Resend SMTP) | 独自フロー (React Email + Resend Node SDK) |
|----------|--------------------------------|--------------------------------------------|
| 実装量 | 小 (本ドキュメント程度) | 中 (Prisma Invitation モデル + Webhook ハンドラ) |
| テンプレ自由度 | Liquid のみ | JSX (React Email) で何でも |
| 送達追跡 | Resend Dashboard で目視 | Webhook → Prisma に永続化、管理画面で表示 |
| 招待失効 / 再送 / 取消 | Supabase API 経由 | 自前ロジックで完全制御 |
| Supabase との結合 | 強 (招待の唯一の真実は auth.users) | 緩 (アプリ DB が真実、Supabase は受諾時に呼ぶ) |

---

## 9. Vercel デプロイ手順

### 9.1 サブドメイン追加

1. Vercel Dashboard → 本プロジェクト → **Settings → Domains**
2. **Add** で `admin.<本番ドメイン>` を入力 (例: `admin.lumina-work.jp`)
3. Vercel が表示する DNS 設定をコピー (通常は CNAME `cname.vercel-dns.com`)
4. ドメイン管理 (Cloudflare / Route53 / Value Domain) で CNAME を追加
   ```
   admin.lumina-work.jp.   CNAME   cname.vercel-dns.com.
   ```
5. Vercel 側で **Verified** になるまで待つ (TLS 証明書も自動発行)
6. 同 Settings → Domains で **Production Branch** に紐付け (通常 main)

### 9.2 環境変数 (Vercel)

| Key | Scope | 値の作り方 / 出典 |
|-----|-------|------------------|
| `ADMIN_API_KEY` | Production / Preview | `openssl rand -base64 48`。Preview と Production で別の値を入れる |
| `NEXT_PUBLIC_APP_URL` | Production | `https://<本番ドメイン>` (`admin.` ではなく素のドメイン)。招待リンクの redirectTo に使う |
| `NEXT_PUBLIC_SUPABASE_URL` | (既存) | 環境ごとの Supabase プロジェクト URL |
| `SUPABASE_ROLE_KEY` | (既存) | Supabase Dashboard → Settings → API → service_role |
| `DATABASE_URL` / `DIRECT_URL` | (既存) | Production は本番 DB、Preview は dev DB を厳密に分離 (CLAUDE.md §2) |

設定後、Production deployment を 1 度走らせて環境変数が読み込まれるようにする。

### 9.3 Supabase SMTP の有効化

§3〜§4 の手順で Resend を Supabase の SMTP に設定する。本番 Supabase プロジェクトと
開発 Supabase プロジェクトで **別の Resend API キーを使う** (本番 API キーを開発に流用しない)。

### 9.4 デプロイ後の動作確認

1. `https://admin.<本番ドメイン>/` を開く → `/login` にリダイレクトされる
2. `ADMIN_API_KEY` で入力 → `/invites` に遷移する
3. テスト用 email (受信できる自分のアドレス) で招待を 1 件送信
4. メールが届く (件名・本文・差出人ドメインを確認)
5. 受信側からリンクをクリック → `/o/dashboard` に到達
6. 管理画面の招待行が **受諾済み** に変わっていることを確認

### 9.5 ロールバック手順

- ドメインだけ取り戻す: Vercel Domains で `admin.<host>` を **Remove**
- フォールバック: 直近の動いている commit を `git revert` または Vercel の **Promote to Production**
- 招待を全失効: 管理画面の各行で「失効」ボタン (受諾済みは対象外)、または `prisma/_safety.ts` ガードに従って手動で `UPDATE admin_invitations SET status = 'REVOKED' WHERE status = 'PENDING';` を Supabase Dashboard SQL Editor から (本番では必ずバックアップを取ってから)

---

## 10. インシデント対応との関係

本機能は **書き込み系のスクリプトを一切持たない** (CLAUDE.md §3 「破壊的スクリプト」の定義に該当しない)。
ただし以下の点で本番影響があり得る:

1. **Supabase Auth テンプレートの誤編集** → 招待メールが届かない/壊れる
   - 対応: 変更前のテンプレートを必ずスクリーンショットで保存
2. **Resend ドメイン未検証のまま運用開始** → 送信失敗、ユーザーが受け取れない
   - 対応: §3.1 の検証完了を Resend Dashboard で確認してから Supabase SMTP を有効化
3. **ADMIN_API_KEY 漏洩** → 管理画面に第三者ログイン
   - 対応: Vercel env で即座にローテーション → 全 admin-session cookie が自動失効
   - 共有しない、`.env` を git にコミットしない (`.gitignore` 確認)

---

## 関連ドキュメント

- `CLAUDE.md` (リポジトリルート) — 本番 DB ガード規定
- `docs/supabase-environment-separation.md` — Supabase プロジェクト分離手順
- `prisma/_safety.ts` — 破壊的スクリプトガード
