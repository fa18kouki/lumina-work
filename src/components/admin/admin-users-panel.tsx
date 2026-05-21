"use client";

import { useEffect, useState } from "react";

import { AdminUserList } from "./admin-user-list";

type RoleFilter = "ALL" | "CAST" | "OWNER" | "ADMIN";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "CAST", label: "キャスト" },
  { value: "OWNER", label: "オーナー" },
  { value: "ADMIN", label: "管理者" },
];

export function AdminUsersPanel() {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");

  // 検索 debounce 300ms — タイプ毎に Prisma クエリを撃たないため
  useEffect(() => {
    const handle = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(handle);
  }, [rawSearch]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">ユーザー一覧</h2>
        <p className="text-sm text-slate-600">
          登録ユーザー (退会済みは除外) を email / phone で絞り込めます。
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                role === opt.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only">検索</span>
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="email / 電話番号で検索"
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
      </div>

      <AdminUserList
        role={role === "ALL" ? undefined : role}
        search={search.length > 0 ? search : undefined}
      />
    </section>
  );
}
