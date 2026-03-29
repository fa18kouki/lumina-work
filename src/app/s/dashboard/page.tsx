"use client";

import Link from "next/link";
import {
  FileEdit,
  Search,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { RankBadge } from "@/components/ui/rank-badge";
import { trpc } from "@/lib/trpc";

function formatOfferDate(d: Date | string) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

function formatInterviewDate(d: Date | string) {
  const date = new Date(d);
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdays[date.getDay()];
  return `${m}月${day}日(${w})`;
}

function formatInterviewTime(d: Date | string) {
  const date = new Date(d);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoreDashboardPage() {
  const offersQuery = trpc.store.getSentOffers.useQuery({});
  const interviewsQuery = trpc.interview.getInterviews.useQuery({
    status: "SCHEDULED",
  });

  if (offersQuery.isLoading || interviewsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const offers = offersQuery.data?.offers ?? [];
  const interviews = interviewsQuery.data?.interviews ?? [];

  return (
    <div className="space-y-10">
      {/* 2カラム: 送信オファー + 今週の面接予定 */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* 送信オファー */}
        <div className="bg-white rounded-lg p-6 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-(--text-main) flex items-center gap-2">
              <span className="block w-1 h-5 bg-slate-700 rounded-sm" />
              送信オファー
            </h2>
            <Link
              href="/s/casts"
              className="text-sm text-(--secondary-blue-text) font-medium hover:underline"
            >
              すべて見る <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    送信日時
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    キャスト名
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    年齢
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    診断結果
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    ステータス
                  </th>
                  <th className="text-left py-3 px-4 text-[13px] text-(--text-sub) font-medium border-b border-gray-200">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody>
                {offers.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-(--text-main) border-b border-gray-100">
                      {formatOfferDate(row.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-sm text-(--text-main) border-b border-gray-100 max-w-[150px] truncate">
                      {row.cast?.nickname ?? "キャスト"}
                    </td>
                    <td className="py-4 px-4 text-sm text-(--text-main) border-b border-gray-100">
                      {row.cast?.age}歳
                    </td>
                    <td className="py-4 px-4 border-b border-gray-100">
                      <RankBadge rank={row.cast?.rank ?? "C"} size="md" />
                    </td>
                    <td className="py-4 px-4 border-b border-gray-100">
                      <StatusBadge status={row.status} variant="offer" size="md" />
                    </td>
                    <td className="py-4 px-4 border-b border-gray-100">
                      <button
                        type="button"
                        className="py-1.5 px-4 rounded-md text-xs font-medium border border-gray-200 bg-white text-(--text-main) hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* クイックアクション */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-(--text-main) flex items-center gap-2 mb-5">
              <span className="block w-1 h-5 bg-slate-700 rounded-sm" />
              クイックアクション
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <Link
                href="/s/profile"
                className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl text-slate-700 font-bold text-[15px] bg-gray-100 shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] hover:shadow-[2px_2px_6px_#d1d5db,-2px_-2px_6px_#ffffff] hover:text-slate-900 active:shadow-[inset_2px_2px_5px_#d1d5db,inset_-2px_-2px_5px_#ffffff] transition-all"
              >
                <FileEdit className="w-5 h-5" aria-hidden />
                求人情報を更新
              </Link>
              <Link
                href="/s/casts"
                className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl text-slate-700 font-bold text-[15px] bg-gray-100 shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] hover:shadow-[2px_2px_6px_#d1d5db,-2px_-2px_6px_#ffffff] hover:text-slate-900 active:shadow-[inset_2px_2px_5px_#d1d5db,inset_-2px_-2px_5px_#ffffff] transition-all"
              >
                <Search className="w-5 h-5" aria-hidden />
                応募者を検索
              </Link>
            </div>
          </div>
        </div>

        {/* 今週の面接予定 */}
        <div className="bg-white rounded-lg p-6 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-(--text-main) flex items-center gap-2">
              <span className="block w-1 h-5 bg-slate-700 rounded-sm" />
              今週の面接予定
            </h2>
            <Link
              href="/s/interviews"
              className="text-sm text-(--secondary-blue-text) font-medium hover:underline"
            >
              カレンダー <Calendar className="inline w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-[13px] text-(--text-sub)">
                  <Clock className="w-4 h-4 shrink-0" aria-hidden />
                  {formatInterviewDate(item.scheduledAt)}{" "}
                  {formatInterviewTime(item.scheduledAt)}
                  <span className="ml-auto shrink-0">
                    <StatusBadge status={item.status} variant="interview" size="md" />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base text-(--text-main)">
                    {item.cast?.nickname ?? "キャスト"}
                    {item.cast?.age != null && ` (${item.cast.age})`}
                  </span>
                  <RankBadge rank={item.cast?.rank ?? "C"} size="md" />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    className="flex-1 py-2 text-center rounded-md text-[13px] font-medium bg-white text-slate-700 border border-slate-300 hover:opacity-90 transition-opacity"
                  >
                    詳細
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
