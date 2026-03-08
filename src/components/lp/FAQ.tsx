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
      "A. はい、完全無料でご利用いただけます。診断から店舗とのやりとりまで、一切費用はかかりません。",
  },
  {
    question: "Q. 個人情報は安全ですか？",
    answer:
      "A. 個人情報の取り扱いには細心の注意を払っており、暗号化通信を使用しています。また、匿名でのやりとりが可能なため、面接を決定するまで個人情報を開示する必要はありません。",
  },
  {
    question: "Q. 無理な勧誘はありませんか？",
    answer:
      "A. いいえ、一切ありません。あなたのペースで、気になるお店とやりとりしていただけます。断る場合も、アプリ上で簡単にお断りできます。",
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
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <span className="text-sm tracking-widest uppercase text-gray-400">
            FAQ
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-2 text-gray-900">
            よくある質問
          </h2>
          <p className="text-sm mt-2 text-gray-500">
            皆さまからよく寄せられる質問にお答えします
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden border bg-white border-gray-200"
            >
              {/* Question button */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-900">
                  {faq.question}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform duration-200 shrink-0 ml-4 text-gray-500 ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                  <p className="text-sm leading-relaxed pt-4 text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
