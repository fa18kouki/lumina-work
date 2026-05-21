"use client";

import { useId, useState } from "react";

import { trpc } from "@/lib/trpc";

interface AdminInvitation {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: Date;
  lastSentAt: Date | null;
}

const STATUS_STYLE: Record<AdminInvitation["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  REVOKED: "bg-slate-200 text-slate-600",
};

const STATUS_LABEL: Record<AdminInvitation["status"], string> = {
  PENDING: "未受諾",
  ACCEPTED: "受諾済み",
  REVOKED: "失効",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminInviteRow({
  invitation,
}: {
  invitation: AdminInvitation;
}) {
  const utils = trpc.useUtils();
  const resendErrorId = useId();
  const revokeErrorId = useId();
  const confirmDialogId = useId();
  const confirmTitleId = useId();
  const [confirming, setConfirming] = useState(false);

  const resend = trpc.adminPanel.invite.resend.useMutation({
    onSuccess: async () => {
      await utils.adminPanel.invite.list.invalidate();
    },
  });

  const revoke = trpc.adminPanel.invite.revoke.useMutation({
    onSuccess: async () => {
      setConfirming(false);
      await utils.adminPanel.invite.list.invalidate();
    },
  });

  const isBusy = resend.isPending || revoke.isPending;
  const canMutate = invitation.status !== "ACCEPTED";

  function onConfirmRevoke() {
    revoke.mutate({ id: invitation.id });
  }

  return (
    <tr className="text-slate-700">
      <td className="px-4 py-3 font-medium text-slate-900">
        {invitation.email}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[invitation.status]}`}
        >
          {STATUS_LABEL[invitation.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {formatDate(invitation.createdAt)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {formatDate(invitation.lastSentAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => resend.mutate({ id: invitation.id })}
            disabled={!canMutate || isBusy}
            aria-describedby={resend.error ? resendErrorId : undefined}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resend.isPending ? "..." : "再送"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!canMutate || isBusy}
            aria-describedby={revoke.error ? revokeErrorId : undefined}
            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {revoke.isPending ? "..." : "失効"}
          </button>
        </div>

        {/* inline alertdialog — window.confirm の置き換え */}
        {confirming ? (
          <div
            role="alertdialog"
            id={confirmDialogId}
            aria-labelledby={confirmTitleId}
            className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-left"
          >
            <p id={confirmTitleId} className="text-xs text-red-800">
              <strong>{invitation.email}</strong> の招待を失効しますか?
              <br />
              Supabase 側のユーザーも削除されます (受諾済みは失効不可)。
            </p>
            <div className="mt-2 inline-flex gap-2">
              <button
                type="button"
                autoFocus
                onClick={onConfirmRevoke}
                disabled={revoke.isPending}
                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {revoke.isPending ? "失効中..." : "はい、失効する"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={revoke.isPending}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : null}

        {resend.error ? (
          <p
            id={resendErrorId}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {resend.error.message}
          </p>
        ) : null}
        {revoke.error ? (
          <p
            id={revokeErrorId}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {revoke.error.message}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
