"use client";

import { use } from "react";

export default function StoreCastsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-4">
        キャスト検索
      </h1>
      <p className="text-[var(--text-sub)]">
        店舗ID: {storeId} のキャスト検索画面（実装予定）
      </p>
    </div>
  );
}
