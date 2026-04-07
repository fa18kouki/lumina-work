"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { findAreasByAddress } from "@/lib/areas";
import { AreaSelect } from "@/components/ui/area-select";
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
  const [prefecture, setPrefecture] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const fullAddress = `${prefecture}${address1}${address2}`.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !area || !prefecture || !address1) return;
    createStore.mutate({ name, area, address: fullAddress });
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

        <PostalCodeInput
          onAddressFound={({ prefecture: pref, city, town }) => {
            setPrefecture(pref);
            setAddress1(`${city}${town}`);
            const candidates = findAreasByAddress(pref, city);
            if (candidates.length > 0 && !area) {
              setArea(candidates[0]);
            }
          }}
        />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              都道府県 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prefecture}
              readOnly
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-[var(--text-sub)] focus:outline-none"
              placeholder="郵便番号から自動入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              市区町村・番地 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
              placeholder="例: 名古屋市中区錦2-14-5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              建物名・部屋番号
            </label>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
              placeholder="例: ○○ビル3F"
            />
          </div>

          <p className="text-xs text-[var(--text-sub)]">
            郵便番号を入力すると都道府県・市区町村が自動入力されます
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
            エリア <span className="text-red-500">*</span>
          </label>
          <AreaSelect
            value={area}
            onChange={setArea}
            placeholder="エリアを選択"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
          />
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
            disabled={
              createStore.isPending || !name || !area || !prefecture || !address1
            }
            className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createStore.isPending ? "作成中..." : "店舗を作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
