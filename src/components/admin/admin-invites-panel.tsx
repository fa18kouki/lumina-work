"use client";

import { useState } from "react";

import { AdminInviteCreateForm } from "./admin-invite-create-form";
import { AdminInviteList } from "./admin-invite-list";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REVOKED";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "PENDING", label: "未受諾" },
  { value: "ACCEPTED", label: "受諾済み" },
  { value: "REVOKED", label: "失効" },
];

export function AdminInvitesPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          オーナー招待 (店舗側アカウント)
        </h2>
        <p className="text-sm text-slate-600">
          email を指定して招待メールを送ります。受諾するとオーナーとして
          `/o/dashboard` にログインできるようになります。
        </p>
      </header>

      <AdminInviteCreateForm />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === opt.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <AdminInviteList
          status={statusFilter === "ALL" ? undefined : statusFilter}
        />
      </div>
    </section>
  );
}
