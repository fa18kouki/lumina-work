"use client";

import Link from "next/link";
import { Heart, Brain, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  comingSoon?: boolean;
}

function GameCard({ title, description, icon: Icon, href, comingSoon }: GameCardProps) {
  const content = (
    <div
      className={`rounded-2xl p-6 border text-center flex flex-col items-center gap-4 transition-all duration-200 ${
        comingSoon
          ? "bg-gray-50 border-gray-200 opacity-60 cursor-default"
          : "bg-pink-50 border-pink-100 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${
          comingSoon ? "bg-gray-200" : "bg-pink-500"
        }`}
      >
        <Icon className={`w-7 h-7 ${comingSoon ? "text-gray-400" : "text-white"}`} />
      </div>

      <div>
        <h3 className={`font-bold text-lg ${comingSoon ? "text-gray-400" : "text-gray-900"}`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${comingSoon ? "text-gray-400" : "text-gray-600"}`}>
          {description}
        </p>
      </div>

      {comingSoon ? (
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-500">
          Coming Soon
        </span>
      ) : (
        <span className="inline-block text-sm font-semibold px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-md">
          遊んでみる
        </span>
      )}
    </div>
  );

  if (comingSoon || !href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

const games: GameCardProps[] = [
  {
    title: "相性占い",
    description: "お互いの名前を入力して、二人の相性をチェック！",
    icon: Heart,
    href: "/games/compatibility",
  },
  {
    title: "心理テスト",
    description: "簡単な質問に答えて、あなたの隠れた魅力を診断",
    icon: Brain,
    href: "/games/psychology",
  },
  {
    title: "タイプ診断",
    description: "あなたの好みのタイプを分析します",
    icon: Sparkles,
    href: "/games/type-diagnosis",
  },
];

export function MiniGames() {
  return (
    <section className="border-t border-stone-100 bg-pink-50/30 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold text-pink-500">Column / 遊び心</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            ちょっとした診断・ゲーム
          </h2>
          <p className="text-sm mt-2 text-gray-600">
            休憩がてら遊べるコンテンツです。本診断とは結果が異なる場合があります。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}
