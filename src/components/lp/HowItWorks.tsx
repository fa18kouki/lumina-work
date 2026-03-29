"use client";

import Image from "next/image";
import { lpLuminaAssets } from "@/lib/lp-assets";

const FLOW_IMAGES = [
  { src: lpLuminaAssets.flow01Register, alt: "登録・ログイン画面のイメージ" },
  { src: lpLuminaAssets.flow02AiChat, alt: "AIチャット診断画面のイメージ" },
  { src: lpLuminaAssets.flow03Result, alt: "診断結果画面のイメージ" },
  { src: lpLuminaAssets.flow04Stores, alt: "店舗検索画面のイメージ" },
  { src: lpLuminaAssets.flow05Offers, alt: "オファー一覧画面のイメージ" },
] as const;

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "基本情報・ログイン",
      subtitle: "SNSアカウントでかんたん",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "AIチャット診断",
      subtitle: "テキストで質問に回答",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "診断結果",
      subtitle: "適正時給の目安を表示",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "お店を探す",
      subtitle: "エリア・条件で検索",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: "05",
      title: "オファーが届く",
      subtitle: "条件の合う店舗から通知",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t border-rose-100/80 bg-gradient-to-b from-white to-rose-50/30 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-rose-500">ご利用の流れ</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            はじめての方でも、この5ステップ
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            画面のイメージとあわせて、登録からオファーまでの流れをご紹介します。
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-rose-100 bg-rose-50/60 p-4 md:mt-12">
          <p className="text-sm font-semibold text-rose-700">ご利用条件</p>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            <li>・18歳以上（高校生不可）</li>
            <li>・個人情報の取り扱いへの同意</li>
          </ul>
        </div>

        {/* モバイル: 横スクロール / デスクトップ: 2列グリッド */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className="w-[min(100%,340px)] shrink-0 snap-center rounded-2xl border border-stone-200/80 bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] md:w-auto"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-stone-50">
                <Image
                  src={FLOW_IMAGES[index].src}
                  alt={FLOW_IMAGES[index].alt}
                  fill
                  className="object-contain object-bottom p-3"
                  sizes="(max-width: 768px) 340px, (max-width: 1200px) 50vw, 400px"
                />
                <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                  STEP {step.number}
                </span>
              </div>
              <div className="flex gap-3 border-t border-stone-100 p-4 md:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-stone-900">{step.title}</h3>
                  {step.subtitle && (
                    <p className="mt-0.5 text-sm text-stone-600">{step.subtitle}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-stone-900">プロフィールについて</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                入力いただいた希望条件やプロフィールをもとに、マッチしやすい店舗へ情報が届きます。あなたに合った店舗からオファーが届く仕組みです。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
