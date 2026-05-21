"use client";

import { useState } from "react";

import { AdminOfferFunnel } from "./admin-offer-funnel";
import { AdminOfferList } from "./admin-offer-list";

type OfferStatusFilter =
  | "ALL"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

const FILTER_OPTIONS: { value: OfferStatusFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "PENDING", label: "応答待ち" },
  { value: "ACCEPTED", label: "受諾" },
  { value: "REJECTED", label: "拒否" },
  { value: "EXPIRED", label: "期限切れ" },
];

export function AdminOffersPanel() {
  const [status, setStatus] = useState<OfferStatusFilter>("ALL");

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">オファーの流れ</h2>
        <p className="text-sm text-slate-600">
          応答待ち → 受諾 → 面接 までの遷移と、最新のオファー行を一覧できます。
        </p>
      </header>

      <AdminOfferFunnel />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                status === opt.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <AdminOfferList status={status === "ALL" ? undefined : status} />
      </div>
    </section>
  );
}
