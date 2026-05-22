# メール送信アーキテクチャ

最終更新: 2026-05-22 (RUN-506)

このドキュメントは lumina-work における **認証メール / 通知メールの送信主体・経路** の住み分けを定義する。実装変更時はまずここを更新してから着手すること。

---

## 結論 (TL;DR)

> **メール送信主体は全経路 Resend SDK**。Supabase ダッシュボードの Email Templates 設定には依存しない。

| ロール | 認証経路 | 認証メールの送信主体 |
|--------|---------|-------------------|
| **Cast** | NextAuth (LINE / Twitter / Email Provider) | `src/lib/auth-resend-provider.ts` (Resend SDK) |
| **Owner** | Supabase Auth (signInWithPassword + token 系) | `src/server/auth/owner-email.ts` (Resend SDK) |
| 通知 (Cast / Owner 共通) | — | `src/server/notifications/channels/email.tsx` (Resend SDK) |

Supabase ダッシュボードの **Authentication → Email Templates** の自動送信は **使わない**。Supabase Auth API (`admin.generateLink`) でリンク発行だけしてもらい、メール送信はアプリ側で Resend SDK を直接叩く。これにより:

- 文面・件名・テンプレ管理がコード (`src/emails/*`) に一元化される
- Supabase ダッシュボード設定への依存ゼロ (検証可能性 / dev-prod parity が確保される)
- 通知メール (offer-received など) と同じパイプライン (Resend SDK) で送られるため運用が単純

---

## 経路別フロー

### 1. Cast — NextAuth Email Provider (Resend SDK)

```
ユーザー → /c/(auth)/login で email 入力
        ↓ signIn("nodemailer", { email })  (next-auth/react)
        ↓
NextAuth Email Provider (id: "nodemailer", 実装は ResendEmailProvider)
        ↓ sendVerificationRequest()  (auth-resend-provider.ts)
        ↓
getResend().emails.send({ react: <MagicLinkEmail url={...} />, ... })
        ↓
ユーザー受信 → リンククリック → NextAuth callback → session 確立
```

実装:
- ログインフォーム: `src/app/c/(auth)/login/page.tsx`
- NextAuth 設定: `src/lib/auth.ts`
- Email Provider 実装: `src/lib/auth-resend-provider.ts`
- テンプレ: `src/emails/magic-link.tsx`

Cast の LINE / Twitter ログインも NextAuth 経由 (OAuth)。メール送信は LINE / Twitter では不要。

---

### 2. Owner — Supabase Auth + Resend SDK 直送

```
ユーザー → /o/register or /o/forgot-password でフォーム送信
        ↓ tRPC mutation: ownerAuth.requestSignup / requestPasswordReset
        ↓
src/server/api/routers/owner-auth.ts
        ↓ issueOwnerSignupLink / issueOwnerRecoveryLink
        ↓
supabase.auth.admin.generateLink({ type: 'signup' | 'recovery', ... })  ← server 側
        ↓ data.properties.action_link を取得
        ↓ sendOwnerSignupConfirmEmail / sendOwnerPasswordResetEmail
        ↓
getResend().emails.send({ react: <Owner* />, ... })
        ↓
ユーザー受信 → リンククリック → /o/login or /o/reset-password に着地
```

admin 招待も同パターン:

```
admin → /admin/invite で email 入力
      ↓ adminPanel.invite.create mutation
      ↓
src/server/api/routers/admin-panel/invite.ts
      ↓ issueOwnerInviteLink + sendOwnerInviteEmail
      ↓
getResend().emails.send({ react: <OwnerInviteEmail />, ... })
```

実装:
- フォーム: `src/app/o/register/page.tsx`, `src/app/o/forgot-password/page.tsx`, `src/app/admin/...` (admin panel)
- tRPC mutations: `src/server/api/routers/owner-auth.ts`, `src/server/api/routers/admin-panel/invite.ts`
- 共通モジュール (`generateLink` + Resend send): `src/server/auth/owner-email.ts`
- テンプレ: `src/emails/owner-invite.tsx`, `owner-signup-confirm.tsx`, `owner-password-reset.tsx`

**注意**: Owner ログイン (`signInWithPassword`) はメール送信を伴わないので、このパイプラインを通らない。Supabase Auth が JWT を直接返すだけ。

---

### 3. 通知メール (Cast / Owner 共通) — Resend SDK 直送

```
イベント発生 (offer 受信 / 面接スケジュール 等)
        ↓
src/server/notifications/dispatch.ts
        ↓ チャネル選択: email チャネル
        ↓
src/server/notifications/channels/email.tsx
        ↓
getResend().emails.send({ react: <Offer*Email />, ... })
```

通知メールは認証経路と独立。Cast / Owner の区別はテンプレート内で吸収する。Supabase Auth と無関係。

---

## 新規メールを追加する時のチェックリスト

1. **「どの経路？」を決める**:
   - Cast の認証ハンドシェイク (login 等) → NextAuth Email Provider 経由 (`auth-resend-provider.ts` を流用、テンプレを `src/emails/` に追加)
   - Owner の認証ハンドシェイク (signup / recovery / invite 等) → `src/server/auth/owner-email.ts` に `issue*Link` + `send*Email` を追加
   - イベント駆動の通知 → `src/server/notifications/` の dispatcher に新規 channel/event を追加
2. **テンプレ作成**: `src/emails/<role>-<purpose>.tsx` を `_layout.tsx` を継承して新設。React Email コンポーネント + plain text fallback + subject builder の 3 点セット。
3. **テスト**: `tests/emails/<name>.test.tsx` でレンダリング snapshot、`tests/server/auth/owner-email.test.ts` か `tests/server/api/routers/owner-auth.test.ts` で送信パイプラインを mock 検証。
4. **環境変数の確認**: `RESEND_API_KEY` と `EMAIL_FROM` (検証済みドメイン由来) が設定されていること。dev 環境では `EMAIL_FROM=LUMINA <noreply@dev.example.com>` 等で OK。
5. **Supabase Auth が絡む場合**: ダッシュボード側のテンプレートを **触る必要は無い** (通らないので)。むしろ、自動送信が有効だと二重送信になるリスクがあるので、Email Templates の Subject / Body は空 or "Do not edit; this template is not used in this project" のコメントだけ残すと安全。

---

## やってはいけないこと

- `supabase.auth.signUp` / `supabase.auth.resetPasswordForEmail` / `supabase.auth.admin.inviteUserByEmail` を **クライアントから直接叩く**。これらは Supabase の自動メール送信を発火させ、ダッシュボード設定の文面で送られる (= 文面管理がコード外に逃げる)。Owner 経路ではすべて `src/server/auth/owner-email.ts` を経由すること。
- `auth-resend-provider.ts` を Owner 経路に流用する。これは NextAuth Email Provider の SDK インターフェース実装であり、Owner の Supabase Auth 経路とは別物。
- Supabase ダッシュボードの Email Templates を編集して文面を変える。**変更はリポジトリで管理**するのが本ドキュメントの方針。
- 通知メールに Supabase Auth リンクを混ぜる (notification と auth でレイヤーが違う)。

---

## 関連 PR / Issue

- [RUN-505](https://linear.app/runtime-studioco/issue/RUN-505) — admin invite だけ Resend 化 (前段)
- [RUN-506](https://linear.app/runtime-studioco/issue/RUN-506) — Owner 認証メール一括 Resend 化 + Cast NextAuth 一本化 (本ドキュメントの起源)
