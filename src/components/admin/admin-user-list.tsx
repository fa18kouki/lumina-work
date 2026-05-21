"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/lib/trpc";

import { formatDate } from "./format";

interface AdminUserListProps {
  role?: "CAST" | "OWNER" | "ADMIN";
  search?: string;
}

const ROLE_STYLE: Record<"CAST" | "OWNER" | "ADMIN", string> = {
  CAST: "bg-pink-100 text-pink-800",
  OWNER: "bg-indigo-100 text-indigo-800",
  ADMIN: "bg-slate-900 text-white",
};

export function AdminUserList({ role, search }: AdminUserListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // フィルタが変わったら 1 ページ目に戻す
  useEffect(() => {
    setCursor(undefined);
  }, [role, search]);

  const query = trpc.adminPanel.users.list.useQuery(
    { role, search, cursor, limit: 50 },
    { staleTime: 15_000 },
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

  const { users, nextCursor } = query.data ?? { users: [], nextCursor: null };

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        該当するユーザーはいません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                email
              </th>
              <th scope="col" className="px-4 py-3">
                電話
              </th>
              <th scope="col" className="px-4 py-3">
                role
              </th>
              <th scope="col" className="px-4 py-3">
                プロフィール
              </th>
              <th scope="col" className="px-4 py-3">
                登録日時
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {u.email ?? <span className="text-slate-400">-</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {u.phone ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLE[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {u.cast ? (
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-medium text-slate-900">
                        {u.cast.nickname}
                      </span>
                      <span className="rounded-sm bg-slate-100 px-1 text-[10px] text-slate-600">
                        rank {u.cast.rank}
                      </span>
                      {u.cast.idVerified ? null : (
                        <span className="rounded-sm bg-amber-100 px-1 text-[10px] text-amber-800">
                          身分未確認
                        </span>
                      )}
                      {u.cast.isSuspended ? (
                        <span className="rounded-sm bg-red-100 px-1 text-[10px] text-red-800">
                          停止中
                        </span>
                      ) : null}
                    </span>
                  ) : u.owner ? (
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <span className="font-medium text-slate-900">
                        {u.owner.companyName ?? "(会社名未登録)"}
                      </span>
                      <span className="rounded-sm bg-slate-100 px-1 text-[10px] text-slate-600">
                        店舗 {u.owner.stores.length}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!nextCursor}
          onClick={() => nextCursor && setCursor(nextCursor)}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          次のページ
        </button>
      </div>
    </div>
  );
}
