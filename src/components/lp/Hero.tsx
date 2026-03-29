"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { lpLuminaAssets } from "@/lib/lp-assets";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-pink-100 to-purple-100"
    >
      {/* 装飾 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-400 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-pink-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-purple-200 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-pink-400 rounded-full blur-3xl opacity-50" />

      {/* ヘッダー */}
      <header className="relative z-20 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/Image.png" alt="LUMINA" width={140} height={42} priority />
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href={session.user.role === "STORE" ? "/s/dashboard" : "/c/dashboard"}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-pink-500 text-white hover:bg-pink-600"
              >
                {session.user.role === "STORE" ? "管理画面へ" : "マイページへ"}
              </Link>
            ) : (
              <>
                <Link
                  href="/c/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                >
                  ログイン
                </Link>
                <Link
                  href="/s/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  店舗の方
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-32 md:pt-24 md:pb-40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-8">
        <div className="max-w-xl shrink-0">
          {/* バッジ */}
          <div
            className="inline-flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>登録不要・30秒でAIが判定</span>
          </div>

          {/* キャッチコピー */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-gray-900">
              今の時給、
            </span>
            <br />
            <span className="font-extrabold text-pink-500">
              安すぎない？
            </span>
          </h1>

          {/* サブテキスト */}
          <p className="text-lg md:text-xl mb-8 leading-relaxed text-gray-600">
            AIがあなたの市場価値を診断。
            <br className="hidden sm:block" />
            適正時給と希望条件に合う店舗を見つけよう。
          </p>

          {/* CTA */}
          <Link
            href="/diagnosis"
            className="inline-flex items-center gap-3 font-semibold py-4 px-8 rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg bg-pink-500 text-white hover:bg-pink-600 shadow-pink-500/25"
          >
            <span>AI時給診断をスタートする</span>
            <svg
              className="w-5 h-5"
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

          {/* 所要時間 */}
          <p className="text-sm mt-4 text-gray-500">
            たった30秒 / 完全匿名OK
          </p>
        </div>

        <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:max-w-md shrink-0">
          <div className="relative aspect-[4/5] w-full drop-shadow-2xl">
            <Image
              src={lpLuminaAssets.heroMockup}
              alt="LUMINA アプリの利用イメージ"
              fill
              className="object-contain object-bottom"
              sizes="(max-width: 1024px) 100vw, 28rem"
            />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
