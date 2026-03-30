"use client";

import { use } from "react";

export default function StoreOffersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-4">
        オファー管理
      </h1>
      <p className="text-[var(--text-sub)]">
        店舗ID: {storeId} のオファー管理画面（実装予定）
      </p>
    </div>
  );
}
