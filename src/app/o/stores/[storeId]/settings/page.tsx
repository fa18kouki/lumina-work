"use client";

import { use } from "react";
import Link from "next/link";
import { Bell, Phone } from "lucide-react";

export default function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href={`/o/stores/${storeId}`}
          className="text-sm text-[var(--text-sub)] hover:text-slate-700 mb-2 inline-block"
        >
          ← 店舗ダッシュボードに戻る
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">店舗設定</h1>
      </div>

      <div className="space-y-6">
        {/* 通知設定 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-[var(--text-main)]">通知設定</h2>
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md font-medium">
              実装予定
            </span>
          </div>
          <p className="text-sm text-[var(--text-sub)]">
            新規応募やオファー返答、面接リマインダーなどの通知を管理できます。
          </p>
        </section>

        {/* 連絡先情報 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-[var(--text-main)]">連絡先情報</h2>
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md font-medium">
              実装予定
            </span>
          </div>
          <p className="text-sm text-[var(--text-sub)]">
            キャストとの連絡に使用する電話番号・メールアドレス・LINEの設定を行えます。
          </p>
        </section>
      </div>
    </div>
  );
}
