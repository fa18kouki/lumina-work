"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Copy, Check, Gift, Users, CheckCircle, Clock } from "lucide-react";

export default function OwnerReferralPage() {
  const { data: codeData, isLoading: codeLoading } =
    trpc.referral.getMyReferralCode.useQuery();
  const { data: referrals, isLoading: referralsLoading } =
    trpc.referral.getMyReferrals.useQuery();

  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  const referralUrl =
    codeData?.code
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/o/register?ref=${codeData.code}`
      : "";

  const handleCopy = async (text: string, type: "code" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const completedCount = referrals?.filter((r) => r.status === "COMPLETED").length ?? 0;
  const pendingCount = referrals?.filter((r) => r.status === "PENDING").length ?? 0;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">紹介プログラム</h1>
        <p className="mt-1 text-sm text-gray-500">
          他のオーナーを紹介して、お互いに割引を受けましょう
        </p>
      </div>

      {/* 特典説明（静的コンテンツ - 即時表示） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-slate-600" />
          紹介特典
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">紹介された方</p>
            <p className="text-xl font-bold text-slate-800 mt-1">初月無料</p>
            <p className="text-xs text-gray-500 mt-1">サブスクリプション初月が100%OFF</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">紹介した方（あなた）</p>
            <p className="text-xl font-bold text-slate-800 mt-1">¥10,000 OFF</p>
            <p className="text-xs text-gray-500 mt-1">次回の請求から割引が適用されます</p>
          </div>
        </div>
      </div>

      {/* 紹介コード */}
      {codeLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded-md animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">あなたの紹介コード</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-4 py-3 font-mono text-lg tracking-wider text-gray-900">
                {codeData?.code ?? "---"}
              </div>
              <button
                onClick={() => codeData?.code && handleCopy(codeData.code, "code")}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors text-sm font-medium"
              >
                {copied === "code" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied === "code" ? "コピー済み" : "コピー"}
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">共有URL</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm text-gray-600 truncate"
                />
                <button
                  onClick={() => referralUrl && handleCopy(referralUrl, "url")}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  {copied === "url" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied === "url" ? "コピー済み" : "コピー"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 統計サマリー */}
      <div className="grid grid-cols-3 gap-4">
        {referralsLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="h-5 w-5 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-8 w-10 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{referrals?.length ?? 0}</p>
              <p className="text-xs text-gray-500">紹介数</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">完了</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500">待機中</p>
            </div>
          </>
        )}
      </div>

      {/* 紹介履歴 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">紹介履歴</h2>
        {referralsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !referrals?.length ? (
          <p className="text-sm text-gray-500">まだ紹介履歴はありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">紹介先</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">ステータス</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">紹介日</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-3 text-gray-700">
                      {r.referredEmail ?? "未登録"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "待機中",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COMPLETED: {
      label: "完了",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    EXPIRED: {
      label: "期限切れ",
      className: "bg-gray-50 text-gray-500 border-gray-200",
    },
  };

  const c = config[status] ?? config.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.className}`}
    >
      {c.label}
    </span>
  );
}
