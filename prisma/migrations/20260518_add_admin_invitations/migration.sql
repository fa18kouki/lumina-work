-- =============================================
-- Admin Invitation 監査ログテーブル追加
--
-- 管理画面 (admin.<host>) から発行したオーナー招待の履歴を保持する。
-- 招待自体の真実は Supabase Auth (auth.users.invited_at / email_confirmed_at) にあり、
-- 本テーブルは「誰が・いつ・どの email を招いたか」「最終再送日時」「失効」を保持する。
--
-- 完全に additive: 既存テーブルへの変更なし、データ移行も不要。
-- =============================================

CREATE TYPE "AdminInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

CREATE TABLE "admin_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invited_by_label" TEXT NOT NULL DEFAULT 'admin',
    "status" "AdminInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "supabase_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_invitations_email_key" ON "admin_invitations"("email");
CREATE INDEX "admin_invitations_status_created_at_idx" ON "admin_invitations"("status", "created_at");
