"use client";

import { useState } from "react";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

const faqs = [
  {
    question: "Q. 本当に無料ですか？",
    answer:
      "A. キャスト向けの診断・店舗検索・オファー確認など、基本的な機能は無料でご利用いただけます。料金が発生する場合は、該当画面で明示します。",
  },
  {
    question: "Q. 個人情報は安全ですか？",
    answer:
      "A. 通信の暗号化やアクセス管理など、安全管理に取り組んでいます。取り扱いの詳細はプライバシーポリシーをご確認ください。",
  },
  {
    question: "Q. 無理な勧誘はありませんか？",
    answer:
      "A. オファーの承諾・辞退はご自身で選択いただけます。気に入らない店舗は「みちゃだめ」でブロックすることもできます。",
  },
  {
    question: "Q. 未経験でも大丈夫ですか？",
    answer:
      "A. もちろんです。未経験者歓迎のお店も多数掲載しており、研修制度が充実した店舗もご紹介できます。",
  },
  {
    question: "Q. 学業との両立はできますか？",
    answer:
      "A. できます。シフトの融通が利くお店や、短時間勤務OKのお店など、あなたのライフスタイルに合わせた働き方が可能なお店をご紹介します。",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-stone-100 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold text-pink-500">Q&amp;A</p>
          <h2 className="mt-2 text-2xl font-bold text-stone-900 md:text-3xl">よくあるご質問</h2>
          <p className="mt-2 text-sm text-stone-600">はじめての方からよくいただく内容をまとめました</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/50"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/80"
              >
                <span className="text-sm font-semibold text-stone-900">{faq.question}</span>
                <ChevronDownIcon
                  className={`ml-4 h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="border-t border-stone-200 px-5 pb-5 pt-0">
                  <p className="pt-4 text-sm leading-relaxed text-stone-600">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
