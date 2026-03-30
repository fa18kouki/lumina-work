"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function OwnerSettingsPage() {
  const { data: profile, isLoading } = trpc.owner.getProfile.useQuery();
  const updateProfile = trpc.owner.upsertProfile.useMutation({
    onSuccess: () => {
      utils.owner.getProfile.invalidate();
    },
  });
  const utils = trpc.useUtils();

  const [companyName, setCompanyName] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setCompanyName(profile.companyName ?? "");
    setInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  const handleSave = () => {
    updateProfile.mutate({ companyName: companyName || undefined });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-8">
        オーナー設定
      </h1>

      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-base font-bold text-[var(--text-main)] mb-4">
          基本情報
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              法人名・屋号（任意）
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
              placeholder="例: 株式会社LUMINAグループ"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? "保存中..." : "保存"}
          </button>
          {updateProfile.isSuccess && (
            <p className="text-sm text-green-600">保存しました</p>
          )}
        </div>
      </div>
    </div>
  );
}
