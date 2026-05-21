"use client";

import { trpc } from "@/lib/trpc";

const OFFER_LABELS: Record<
  "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED",
  { label: string; tone: string }
> = {
  PENDING: { label: "応答待ち", tone: "bg-amber-50 text-amber-900" },
  ACCEPTED: { label: "受諾", tone: "bg-emerald-50 text-emerald-900" },
  REJECTED: { label: "拒否", tone: "bg-rose-50 text-rose-900" },
  EXPIRED: { label: "期限切れ", tone: "bg-slate-100 text-slate-700" },
};

const INTERVIEW_LABELS: Record<
  "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED",
  { label: string; tone: string }
> = {
  SCHEDULED: { label: "予定", tone: "bg-sky-50 text-sky-900" },
  COMPLETED: { label: "完了", tone: "bg-emerald-50 text-emerald-900" },
  NO_SHOW: { label: "no-show", tone: "bg-red-50 text-red-900" },
  CANCELLED: { label: "キャンセル", tone: "bg-slate-100 text-slate-700" },
};

function percent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function AdminOfferFunnel() {
  const query = trpc.adminPanel.offers.funnel.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (query.isLoading) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        集計中...
      </div>
    );
  }

  if (query.error) {
    return (
      <div
        className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        role="alert"
      >
        funnel 取得失敗: {query.error.message}
      </div>
    );
  }

  const data = query.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          オファー全体 <span className="text-slate-500">({data.offerTotal})</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"] as const).map(
            (k) => {
              const value = data.offers[k];
              const meta = OFFER_LABELS[k];
              return (
                <div
                  key={k}
                  className={`rounded-lg border border-slate-200 p-4 shadow-sm ${meta.tone}`}
                >
                  <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {meta.label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{value}</div>
                  <div className="mt-0.5 text-xs opacity-70">
                    {percent(value, data.offerTotal)}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          面接 (受諾後の遷移)
          <span className="text-slate-500"> ({data.interviewTotal})</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const).map(
            (k) => {
              const value = data.interviews[k];
              const meta = INTERVIEW_LABELS[k];
              return (
                <div
                  key={k}
                  className={`rounded-lg border border-slate-200 p-4 shadow-sm ${meta.tone}`}
                >
                  <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {meta.label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{value}</div>
                  <div className="mt-0.5 text-xs opacity-70">
                    {percent(value, data.interviewTotal)}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </section>
    </div>
  );
}
