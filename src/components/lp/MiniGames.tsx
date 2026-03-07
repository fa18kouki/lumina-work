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
    comingSoon: true,
  },
  {
    title: "タイプ診断",
    description: "あなたの好みのタイプを分析します",
    icon: Sparkles,
    comingSoon: true,
  },
];

export function MiniGames() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-sm tracking-widest uppercase text-gray-400">
            MINI GAMES
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-2 text-gray-900">
            ミニゲーム
          </h2>
          <p className="text-sm mt-2 text-gray-500">
            お客さんと一緒に楽しめるミニゲームで盛り上がろう
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
