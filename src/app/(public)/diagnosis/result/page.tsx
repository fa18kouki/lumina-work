"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useDiagnosis } from "@/lib/diagnosis-provider";
import type { CastRank } from "@/lib/diagnosis-session";

// ランクに応じた色とラベル
const RANK_CONFIG: Record<CastRank, { color: string; bgColor: string; label: string; description: string }> = {
  S: {
    color: "text-yellow-500",
    bgColor: "from-yellow-50 to-yellow-100/50",
    label: "Sランク",
    description: "トップクラスの実力！高級店での活躍が期待できます",
  },
  A: {
    color: "text-pink-500",
    bgColor: "from-pink-50 to-pink-100/50",
    label: "Aランク",
    description: "高い実力があります！人気店で即戦力として活躍できます",
  },
  B: {
    color: "text-blue-500",
    bgColor: "from-blue-50 to-blue-100/50",
    label: "Bランク",
    description: "十分な実力があります！多くの店舗からオファーが届くでしょう",
  },
  C: {
    color: "text-gray-500",
    bgColor: "from-gray-50 to-gray-100/50",
    label: "Cランク",
    description: "これからの成長に期待！未経験歓迎の店舗をご紹介します",
  },
};

export default function DiagnosisResultPage() {
  const router = useRouter();
  const { session } = useDiagnosis();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (!session?.result) {
      router.push("/diagnosis");
      return;
    }

    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, [session, router]);

  if (!session?.result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { result } = session;
  const rankConfig = RANK_CONFIG[result.estimatedRank];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Image src="/Image.png" alt="LUMINA" width={120} height={36} priority />
          </Link>
          <span className="text-xs text-gray-500">診断結果</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* ランク表示 */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${rankConfig.bgColor} border border-gray-200 p-6 text-center shadow-sm transition-all duration-700 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-gray-500 text-sm mb-2">あなたの推定ランク</p>
          <div
            className={`text-7xl font-bold ${rankConfig.color} mb-2`}
          >
            {result.estimatedRank}
          </div>
          <p className={`text-lg font-semibold ${rankConfig.color}`}>
            {rankConfig.label}
          </p>
          <p className="text-gray-500 text-sm mt-2">{rankConfig.description}</p>
        </div>

        {/* 推定時給 */}
        <div
          className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-all duration-700 delay-100 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-gray-500 text-sm mb-1">推定時給</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">
              {result.estimatedHourlyRate.toLocaleString()}
            </span>
            <span className="text-gray-500 text-lg">円〜</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-1">推定月収（週3日勤務の場合）</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-pink-500">
                {result.estimatedMonthlyIncome.toLocaleString()}
              </span>
              <span className="text-gray-500">円</span>
            </div>
          </div>
        </div>

        {/* 分析結果 */}
        <div
          className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-all duration-700 delay-200 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h3 className="text-gray-900 font-semibold mb-4">AI分析結果</h3>

          {/* 強み */}
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-2">あなたの強み</p>
            <div className="flex flex-wrap gap-2">
              {result.analysis.strengths.map((strength, index) => (
                <span
                  key={index}
                  className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-sm border border-pink-100"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          {/* 改善点 */}
          <div className="mb-4">
            <p className="text-gray-500 text-sm mb-2">伸びしろ</p>
            <div className="flex flex-wrap gap-2">
              {result.analysis.improvements.map((improvement, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm border border-gray-200"
                >
                  {improvement}
                </span>
              ))}
            </div>
          </div>

          {/* おすすめ */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">
              {result.analysis.recommendation}
            </p>
          </div>
        </div>

        {/* 条件に合う店舗数 */}
        <div
          className={`bg-pink-50 rounded-2xl p-6 border border-pink-100 text-center transition-all duration-700 delay-300 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-gray-600 mb-2">希望条件に合う店舗</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-gray-900">
              {result.matchingStoreIds.length}
            </span>
            <span className="text-gray-500 text-lg">件</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            希望条件を満たす店舗が見つかりました
          </p>
        </div>

        {/* CTA */}
        <div
          className={`space-y-3 transition-all duration-700 delay-400 ${showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link
            href="/c/login?fromDiagnosis=true"
            className="block w-full bg-pink-500 text-white font-semibold py-4 px-6 rounded-xl text-center hover:bg-pink-600 transition-all active:scale-[0.98] shadow-lg shadow-pink-500/25"
          >
            希望条件を満たす店舗を確認する
          </Link>
          <Link
            href="/"
            className="block w-full text-gray-400 text-sm text-center py-2 hover:text-gray-600 transition-colors"
          >
            トップに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
