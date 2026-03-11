import Link from "next/link";

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744l1.657 6.036 6.036 1.657a1 1 0 010 1.934l-6.036 1.657-1.657 6.036a1 1 0 01-1.934 0l-1.657-6.036-6.036-1.657a1 1 0 010-1.934l6.036-1.657L11.033 2.744A1 1 0 0112 2z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

const badges = [
  { label: "所要時間3分" },
  { label: "完全無料" },
  { label: "匿名OK" },
];

export function CTA() {
  return (
    <section className="relative bg-gradient-to-br from-pink-500 via-pink-400 to-purple-400 py-20 md:py-32 overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-40" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold mb-8">
          <SparklesIcon />
          <span>今すぐ始められます</span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          さあ、新しい一歩を
          <br />
          踏み出そう。
        </h2>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed">
          あなたの可能性を広げる場所が、きっと見つかります。
          <br className="hidden md:block" />
          まずは無料診断から始めてみませんか？
        </p>

        {/* CTA Button */}
        <Link
          href="/c/login"
          className="inline-flex items-center gap-3 bg-white text-pink-600 px-8 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200"
        >
          <span>無料で適性診断をはじめる</span>
          <ArrowRightIcon />
        </Link>

        {/* Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {badges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-base font-semibold text-white/95">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
