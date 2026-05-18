"use client";

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

  const resend = trpc.adminPanel.invite.resend.useMutation({
    onSuccess: async () => {
      await utils.adminPanel.invite.list.invalidate();
    },
  });

  const revoke = trpc.adminPanel.invite.revoke.useMutation({
    onSuccess: async () => {
      await utils.adminPanel.invite.list.invalidate();
    },
  });

  const isBusy = resend.isPending || revoke.isPending;
  const canMutate = invitation.status !== "ACCEPTED";

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
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resend.isPending ? "..." : "再送"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `${invitation.email} の招待を失効しますか?\nSupabase 側のユーザーも削除されます (受諾済みの場合は失効できません)`,
                )
              ) {
                revoke.mutate({ id: invitation.id });
              }
            }}
            disabled={!canMutate || isBusy}
            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {revoke.isPending ? "..." : "失効"}
          </button>
        </div>
        {(resend.error || revoke.error) && (
          <p className="mt-1 text-xs text-red-600">
            {resend.error?.message ?? revoke.error?.message}
          </p>
        )}
      </td>
    </tr>
  );
}
