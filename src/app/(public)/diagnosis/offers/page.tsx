"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useDiagnosis } from "@/lib/diagnosis-provider";
import { trpc } from "@/lib/trpc";

function getHourlyRate(salarySystem: unknown): number | null {
  if (!salarySystem) return null;
  if (typeof salarySystem === "string") return null;
  const sys = salarySystem as Record<string, number>;
  return sys.hourlyRateMin ?? null;
}

export default function DiagnosisOffersPage() {
  const router = useRouter();
  const { session } = useDiagnosis();
  const { data: stores = [], isLoading: storesLoading } = trpc.store.getPublicList.useQuery();
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.result) {
      router.push("/diagnosis");
      return;
    }

    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, [session, router]);

  const handleAcceptOffer = (storeId: string) => {
    setSelectedStoreId(storeId);
    router.push(`/c/login?diagnosisId=${session?.id}&offerId=${storeId}`);
  };

  if (!session?.result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Image src="/Image.png" alt="LUMINA" width={120} height={36} priority />
          </Link>
          <span className="text-xs text-gray-500">条件に合う店舗</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 結果サマリー */}
        <div
          className={`bg-pink-50 rounded-2xl p-4 border border-pink-100 transition-all duration-500 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">あなたの推定時給</p>
              <p className="text-2xl font-bold text-gray-900">
                {session.result.estimatedHourlyRate.toLocaleString()}円〜
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">ランク</p>
              <p className="text-2xl font-bold text-pink-500">
                {session.result.estimatedRank}
              </p>
            </div>
          </div>
        </div>

        {/* セクションヘッダー */}
        <div
          className={`transition-all duration-500 delay-100 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-gray-900 font-semibold text-lg">
            希望条件に合う店舗
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            希望条件をもとに店舗を検索しました
          </p>
        </div>

        {/* 店舗カード一覧 */}
        <div className="space-y-4">
          {storesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
            </div>
          ) : stores.map((store, index) => (
            <div
              key={store.id}
              className={`bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-500 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${(index + 2) * 100}ms` }}
            >
              {/* 店舗画像 */}
              <div className="relative h-40">
                <Image
                  src={store.photos?.[0] ?? "/champagne-night-view.png"}
                  alt={store.name}
                  fill
                  className="object-cover"
                />
                {/* タグ */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {(store.benefits?.slice(0, 2) ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-black/60 text-white text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 店舗情報 */}
              <div className="p-4">
                <h3 className="text-gray-900 font-semibold text-lg">
                  {store.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {store.area}
                </p>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                  {store.description ?? ""}
                </p>

                {/* 時給・待遇 */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-gray-500 text-xs">時給保証</p>
                    <p className="text-pink-500 font-bold text-lg">
                      {getHourlyRate(store.salarySystem)?.toLocaleString() ?? "応相談"}円〜
                    </p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-gray-500 text-xs">待遇</p>
                    <p className="text-pink-500 font-bold text-sm">
                      {store.benefits?.slice(0, 3).join("、") ?? ""}
                    </p>
                  </div>
                </div>

                {/* オファー受諾ボタン */}
                <button
                  onClick={() => handleAcceptOffer(store.id)}
                  disabled={selectedStoreId !== null}
                  className="w-full mt-4 bg-pink-500 text-white font-semibold py-3 px-6 rounded-xl text-center hover:bg-pink-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25"
                >
                  {selectedStoreId === store.id
                    ? "処理中..."
                    : "このお店に応募する"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent pt-8 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-sm font-medium">
                  応募にはLINE登録が必要です
                </p>
                <p className="text-gray-500 text-xs">
                  登録後、お店との連絡が可能になります
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
