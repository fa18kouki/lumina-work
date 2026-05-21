"use client";

import Link from "next/link";
import { Store, Users, FileText, CalendarCheck, Plus, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle, Send, Ticket } from "lucide-react";
import { trpc } from "@/lib/trpc";

const MONTHLY_OFFER_USAGE_PLACEHOLDER = {
  sentThisMonth: 0,
  monthlyLimit: 50,
  ticketsRemaining: 0,
  ticketsTotal: 0,
  yearMonthLabel: "—",
} as const;

export default function OwnerDashboardPage() {
  const { data: dashboard, isLoading } = trpc.owner.getDashboard.useQuery();
  const { data: offerStats } = trpc.owner.getOfferStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  const stores = dashboard?.stores ?? [];
  const subscription = dashboard?.subscription;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          ダッシュボード
        </h1>
        <Link
          href="/o/stores/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          店舗を追加
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-[var(--text-sub)]">管理店舗数</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-main)]">
            {stores.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-[var(--text-sub)]">送信オファー合計</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-main)]">
            {stores.reduce((sum, s) => sum + s._count.offers, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <CalendarCheck className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-[var(--text-sub)]">面接合計</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-main)]">
            {stores.reduce((sum, s) => sum + s._count.interviews, 0)}
          </p>
        </div>
      </div>

      {/*
        オファー月次集計セクション (UI 仮実装 / ダミー数値)
        TODO(RUN-499 follow-up): owner.getMonthlyOfferUsage tRPC 追加 + チケット制 (Ticket model)
        本実装は本稼働後の別 issue で対応。現状はステークホルダー確認用のレイアウトのみ。
      */}
      <h2 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-slate-500" />
        オファー利用状況
        <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          UI 仮表示 / 本実装は本稼働後
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-[var(--text-sub)]">
                今月のオファー送信数
              </span>
            </div>
            <span className="text-xs text-[var(--text-sub)]">
              {MONTHLY_OFFER_USAGE_PLACEHOLDER.yearMonthLabel}
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-main)]">
            {MONTHLY_OFFER_USAGE_PLACEHOLDER.sentThisMonth}
            <span className="text-sm font-normal text-[var(--text-sub)] ml-1">
              / {MONTHLY_OFFER_USAGE_PLACEHOLDER.monthlyLimit} 件
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="bg-slate-900 h-full"
              style={{
                width: `${Math.min(
                  100,
                  (MONTHLY_OFFER_USAGE_PLACEHOLDER.sentThisMonth /
                    MONTHLY_OFFER_USAGE_PLACEHOLDER.monthlyLimit) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-[var(--text-sub)]">
              オファーチケット残数
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-main)]">
            {MONTHLY_OFFER_USAGE_PLACEHOLDER.ticketsRemaining}
            <span className="text-sm font-normal text-[var(--text-sub)] ml-1">
              / {MONTHLY_OFFER_USAGE_PLACEHOLDER.ticketsTotal} 枚
            </span>
          </p>
          <p className="mt-3 text-xs text-[var(--text-sub)] leading-relaxed">
            チケット制は次フェーズで導入予定。チャージや繰越ルールの詳細は別途定義します。
          </p>
        </div>
      </div>

      {/* オファー承諾状況 */}
      {offerStats && offerStats.length > 0 && offerStats.some((s) => s.total > 0) && (
        <>
          <h2 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-500" />
            店舗別オファー状況
          </h2>
          <div className="space-y-3 mb-8">
            {offerStats.map((stat) => (
              <Link
                key={stat.storeId}
                href={`/o/stores/${stat.storeId}/offers`}
                className="block bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[var(--text-main)]">{stat.storeName}</h3>
                    <p className="text-xs text-[var(--text-sub)]">{stat.storeArea}</p>
                  </div>
                  {stat.total > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--text-main)]">{stat.acceptRate}%</p>
                      <p className="text-xs text-[var(--text-sub)]">承諾率</p>
                    </div>
                  )}
                </div>

                {stat.total > 0 ? (
                  <>
                    {/* プログレスバー */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 mb-3">
                      {stat.accepted > 0 && (
                        <div className="bg-green-500" style={{ width: `${(stat.accepted / stat.total) * 100}%` }} />
                      )}
                      {stat.pending > 0 && (
                        <div className="bg-yellow-400" style={{ width: `${(stat.pending / stat.total) * 100}%` }} />
                      )}
                      {stat.rejected > 0 && (
                        <div className="bg-gray-400" style={{ width: `${(stat.rejected / stat.total) * 100}%` }} />
                      )}
                      {stat.expired > 0 && (
                        <div className="bg-red-300" style={{ width: `${(stat.expired / stat.total) * 100}%` }} />
                      )}
                    </div>

                    {/* ステータス内訳 */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        承諾 {stat.accepted}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Clock className="w-3 h-3" />
                        未回答 {stat.pending}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <XCircle className="w-3 h-3" />
                        辞退 {stat.rejected}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        期限切れ {stat.expired}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--text-sub)]">
                        面接 {stat.interviews}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-sub)]">まだオファーを送信していません</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* プラン情報 */}
      {subscription && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-sub)] mb-1">現在のプラン</p>
              <p className="text-lg font-bold text-[var(--text-main)]">
                {subscription.plan === "FREE" && "フリー"}
                {subscription.plan === "CASUAL" && "カジュアル"}
                {subscription.plan === "PRO_TRIAL" && "プロ"}
                {subscription.plan === "PRO_BUSINESS" && "プロ ビジネス"}
                {subscription.plan === "PRO_ENTERPRISE" && "プロ エンタープライズ"}
              </p>
            </div>
            <Link
              href="/o/subscription"
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              プラン管理
            </Link>
          </div>
        </div>
      )}

      {/* 店舗一覧 */}
      <h2 className="text-lg font-bold text-[var(--text-main)] mb-4">
        管理中の店舗
      </h2>
      {stores.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)] mb-4">
            まだ店舗が登録されていません
          </p>
          <Link
            href="/o/stores/new"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            最初の店舗を追加
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/o/stores/${store.id}`}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-[var(--text-main)] group-hover:text-slate-700">
                    {store.name}
                  </h3>
                  <p className="text-sm text-[var(--text-sub)]">{store.area}</p>
                </div>
                {store.isVerified ? (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">
                    認証済み
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md font-medium">
                    未認証
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--text-sub)]">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  オファー {store._count.offers}件
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  面接 {store._count.interviews}件
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
