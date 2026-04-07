"use client";

import { use } from "react";
import Link from "next/link";
import { Users, FileText, CalendarCheck, Settings, Store, Inbox } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const { data: store, isLoading } = trpc.store.getProfile.useQuery({ storeId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-sub)]">店舗が見つかりません</p>
      </div>
    );
  }

  const menuItems = [
    {
      href: `/o/stores/${storeId}/casts`,
      label: "キャスト検索",
      description: "キャストを検索してオファーを送信",
      icon: Users,
    },
    {
      href: `/o/stores/${storeId}/applications`,
      label: "応募管理",
      description: "キャストからの応募の確認と承認",
      icon: Inbox,
    },
    {
      href: `/o/stores/${storeId}/offers`,
      label: "オファー管理",
      description: "送信済みオファーの確認と管理",
      icon: FileText,
    },
    {
      href: `/o/stores/${storeId}/interviews`,
      label: "面接管理",
      description: "面接のスケジュール管理",
      icon: CalendarCheck,
    },
    {
      href: `/o/stores/${storeId}/profile`,
      label: "店舗情報",
      description: "店舗プロフィールの編集",
      icon: Store,
    },
    {
      href: `/o/stores/${storeId}/settings`,
      label: "店舗設定",
      description: "通知設定・連絡先情報",
      icon: Settings,
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/o/stores"
          className="text-sm text-[var(--text-sub)] hover:text-slate-700 mb-2 inline-block"
        >
          ← 店舗一覧に戻る
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            {store.name}
          </h1>
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
        <p className="text-sm text-[var(--text-sub)] mt-1">
          {store.area} · {store.address}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                <h3 className="font-bold text-[var(--text-main)] group-hover:text-slate-700">
                  {item.label}
                </h3>
              </div>
              <p className="text-sm text-[var(--text-sub)]">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
