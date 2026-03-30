"use client";

import { use } from "react";

export default function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-4">
        店舗設定
      </h1>
      <p className="text-[var(--text-sub)]">
        店舗ID: {storeId} の通知設定・連絡先情報画面（実装予定）
      </p>
    </div>
  );
}
