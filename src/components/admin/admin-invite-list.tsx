"use client";

import { trpc } from "@/lib/trpc";

import { AdminInviteRow } from "./admin-invite-row";

interface AdminInviteListProps {
  status?: "PENDING" | "ACCEPTED" | "REVOKED";
}

export function AdminInviteList({ status }: AdminInviteListProps) {
  const query = trpc.adminPanel.invite.list.useQuery(
    { status, take: 100 },
    { staleTime: 30_000 },
  );

  if (query.isLoading) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (query.error) {
    return (
      <div
        className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        role="alert"
      >
        一覧の取得に失敗しました: {query.error.message}
      </div>
    );
  }

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        該当する招待はありません
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">
              email
            </th>
            <th scope="col" className="px-4 py-3">
              状態
            </th>
            <th scope="col" className="px-4 py-3">
              招待日時
            </th>
            <th scope="col" className="px-4 py-3">
              最終送信
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((invite) => (
            <AdminInviteRow key={invite.id} invitation={invite} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
