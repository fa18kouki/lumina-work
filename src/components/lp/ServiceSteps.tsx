import type { ReactNode } from "react";

/**
 * サービス概要グリッド（nomination.co.jp の「サービスについて」に相当）
 */
function IconCircle({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-white shadow-md shadow-pink-500/25">
      {children}
    </div>
  );
}

const services = [
  {
    title: "AIで適正時給の目安がわかる",
    description: "チャット形式の質問に答えるだけ。自分の市場価値のヒントを受け取れます。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "掲載店舗を検索・比較",
    description: "エリアや時給などで絞り込み。気になる店舗の情報を一覧でチェックできます。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "店舗からオファーが届く",
    description: "あなたのプロフィールに興味を持った店舗から、採用オファーが届きます。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "条件で理想に近いお店を探す",
    description: "希望エリア・時給帯など、あなたのこだわりに合わせて店舗を探せます。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    title: "「みちゃだめ」でブロック",
    description: "見られたくない店舗をブロック。プロフィールの見え方を自分でコントロールできます。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ),
  },
  {
    title: "まずは無料で診断から",
    description: "登録前にAI時給診断で流れを体験。会員登録は診断のあとでも構いません。",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function ServiceSteps() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-pink-500">Service</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            サービスについて
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            LUMINAでできること、ざっくりまとめました。
          </p>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {services.map((s) => (
            <li key={s.title} className="text-center">
              <IconCircle>{s.icon}</IconCircle>
              <h3 className="mt-4 text-lg font-bold text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
