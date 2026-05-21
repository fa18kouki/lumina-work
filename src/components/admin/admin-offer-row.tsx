"use client";

import { formatDate } from "./format";

interface AdminOfferRowProps {
  offer: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    createdAt: Date;
    expiresAt: Date;
    cast: {
      id: string;
      nickname: string;
      user: { email: string | null };
    };
    store: {
      id: string;
      name: string;
      area: string;
    };
    interviews: Array<{
      id: string;
      status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
      scheduledAt: Date;
    }>;
  };
}

const OFFER_STATUS_STYLE: Record<AdminOfferRowProps["offer"]["status"], string> =
  {
    PENDING: "bg-amber-100 text-amber-800",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    EXPIRED: "bg-slate-200 text-slate-600",
  };

const OFFER_STATUS_LABEL: Record<AdminOfferRowProps["offer"]["status"], string> =
  {
    PENDING: "応答待ち",
    ACCEPTED: "受諾",
    REJECTED: "拒否",
    EXPIRED: "期限切れ",
  };

const INTERVIEW_STATUS_STYLE: Record<
  AdminOfferRowProps["offer"]["interviews"][number]["status"],
  string
> = {
  SCHEDULED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  NO_SHOW: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

const INTERVIEW_STATUS_LABEL: Record<
  AdminOfferRowProps["offer"]["interviews"][number]["status"],
  string
> = {
  SCHEDULED: "面接予定",
  COMPLETED: "面接完了",
  NO_SHOW: "no-show",
  CANCELLED: "キャンセル",
};

export function AdminOfferRow({ offer }: AdminOfferRowProps) {
  // 最新の面接 (interviews は scheduledAt desc で取得済) を 1 件だけ表示
  const latestInterview = offer.interviews[0];

  return (
    <tr className="text-slate-700">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{offer.cast.nickname}</div>
        <div className="text-xs text-slate-500">
          {offer.cast.user.email ?? "-"}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{offer.store.name}</div>
        <div className="text-xs text-slate-500">{offer.store.area}</div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${OFFER_STATUS_STYLE[offer.status]}`}
        >
          {OFFER_STATUS_LABEL[offer.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {formatDate(offer.createdAt)}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {formatDate(offer.expiresAt)}
      </td>
      <td className="px-4 py-3">
        {latestInterview ? (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${INTERVIEW_STATUS_STYLE[latestInterview.status]}`}
            >
              {INTERVIEW_STATUS_LABEL[latestInterview.status]}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(latestInterview.scheduledAt)}
            </span>
            {offer.interviews.length > 1 ? (
              <span className="text-[10px] text-slate-400">
                ほか {offer.interviews.length - 1} 件
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-slate-400">未調整</span>
        )}
      </td>
    </tr>
  );
}
