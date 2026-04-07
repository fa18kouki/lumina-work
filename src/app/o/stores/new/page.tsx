"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { AREAS } from "@/lib/constants";
import { getAreaAddressPrefix } from "@/lib/areas";
import { PostalCodeInput } from "@/components/ui/postal-code-input";

export default function NewStorePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const createStore = trpc.owner.createStore.useMutation({
    onSuccess: (store) => {
      utils.owner.listStores.invalidate();
      utils.owner.getStoreCount.invalidate();
      router.push(`/o/stores/${store.id}`);
    },
  });

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !area || !address) return;
    createStore.mutate({ name, area, address });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-8">
        新規店舗を追加
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
            店舗名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
            placeholder="例: Club LUMINA 六本木"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
            エリア <span className="text-red-500">*</span>
          </label>
          <select
            value={area}
            onChange={(e) => {
              const selected = e.target.value;
              setArea(selected);
              if (selected && !address.trim()) {
                setAddress(getAreaAddressPrefix(selected));
              }
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
            required
          >
            <option value="">エリアを選択</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <PostalCodeInput
          onAddressFound={(addr) => setAddress(addr)}
        />

        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
            住所 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
            placeholder="例: 愛知県名古屋市錦2-14-5 ○○ビル3F"
            required
          />
          <p className="text-xs text-[var(--text-sub)] mt-1">都道府県から番地・ビル名まで入力してください</p>
        </div>

        {createStore.error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            {createStore.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-medium text-[var(--text-sub)] hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={createStore.isPending || !name || !area || !address}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createStore.isPending ? "作成中..." : "店舗を作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
