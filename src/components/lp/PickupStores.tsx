"use client";

import Image from "next/image";
import Link from "next/link";

// モック店舗データ
const PICKUP_STORES = [
  {
    id: "1",
    name: "Club VENUS - 銀座本店",
    area: "銀座（錦三）",
    access: "栄駅 徒歩3分",
    storeType: "キャバクラ",
    tags: ["日払いOK"],
    hourlyRate: 8000,
    backRate: 60,
    image: "/champagne-night-view.png",
  },
  {
    id: "2",
    name: "Lounge Royal - 六本木",
    area: "六本木",
    access: "六本木駅 徒歩1分",
    storeType: "ラウンジ",
    tags: ["高時給", "未経験歓迎"],
    hourlyRate: 6000,
    backRate: 50,
    image: "/champagne-night-view.png",
  },
  {
    id: "3",
    name: "Night Garden - 新宿",
    area: "新宿・歌舞伎町",
    access: "新宿駅 徒歩5分",
    storeType: "キャバクラ",
    tags: ["週1OK", "送迎あり"],
    hourlyRate: 5000,
    backRate: 45,
    image: "/champagne-night-view.png",
  },
];

export function PickupStores() {
  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 bg-pink-100 text-pink-600">
            今週のピックアップ
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
            LUMINA で
          </h2>
          <p className="text-lg md:text-xl text-gray-800">
            まずはAI適正時給を診断する
          </p>
          <p className="text-sm mt-2 text-gray-500">
            ※診断結果をもとに、グループ内または他店からのオファーを受け取れます
          </p>
        </div>

        {/* 店舗カード */}
        <div className="space-y-4">
          {PICKUP_STORES.map((store) => (
            <div
              key={store.id}
              className="rounded-2xl overflow-hidden border bg-white border-gray-200 shadow-sm"
            >
              {/* 店舗画像 */}
              <div className="relative h-48 md:h-56">
                <Image
                  src={store.image}
                  alt={store.name}
                  fill
                  className="object-cover"
                />
                {/* タグオーバーレイ */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-md">
                    {store.storeType}
                  </span>
                  {store.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 店舗情報 */}
              <div className="p-5">
                <h3 className="font-bold text-xl mb-1 text-gray-900">
                  {store.name}
                </h3>
                <p className="text-sm flex items-center gap-1 text-gray-500">
                  <span className="text-pink-400">📍</span>
                  {store.area} / {store.access}
                </p>

                {/* 時給・バック率 */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 rounded-xl p-4 text-center bg-gray-50">
                    <p className="text-xs mb-1 text-gray-500">
                      時給保証
                    </p>
                    <p className="font-bold text-xl text-pink-500">
                      {store.hourlyRate.toLocaleString()}円〜
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl p-4 text-center bg-gray-50">
                    <p className="text-xs mb-1 text-gray-500">
                      バック率
                    </p>
                    <p className="text-pink-400 font-bold text-xl">
                      最大{store.backRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Link
            href="/diagnosis"
            className="flex items-center justify-between w-full font-semibold py-4 px-6 rounded-2xl transition-all bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/25"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs text-pink-100">
                  自分の市場価値を知る
                </p>
                <p className="text-white font-semibold">
                  AI時給診断をスタートする
                </p>
              </div>
            </div>
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
