"use client";

import Image from "next/image";
import Link from "next/link";
import { lpLuminaAssets } from "@/lib/lp-assets";

/** Nomination と同様の 4 STEP。画像は代表画面を割り当て */
const STEPS = [
  {
    step: "STEP1",
    title: "プロフィールを入力",
    body: "求人店舗向けのプロフィールと、AI診断のための情報を入力。LINEなどでかんたんにログインできます。",
    image: lpLuminaAssets.flow01Register,
    imageAlt: "登録・プロフィール入力のイメージ",
  },
  {
    step: "STEP2",
    title: "お店をチェック",
    body: "気になる店舗を検索して、エリア・時給・待遇などを比較しましょう。",
    image: lpLuminaAssets.flow04Stores,
    imageAlt: "店舗検索のイメージ",
  },
  {
    step: "STEP3",
    title: "診断結果とオファーを確認",
    body: "AI診断の結果のほか、店舗から届く採用オファーの内容をアプリ上で確認できます。",
    image: lpLuminaAssets.flow05Offers,
    imageAlt: "オファー・診断結果のイメージ",
  },
  {
    step: "STEP4",
    title: "店舗と連絡・面接へ",
    body: "オファーを承諾したら、店舗の連絡先から面接日時や条件をすり合わせてください。",
    image: lpLuminaAssets.flow03Result,
    imageAlt: "条件・結果確認のイメージ",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-rose-100 bg-gradient-to-b from-rose-50/50 to-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-rose-500">How to use</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            LUMINA サービスの使い方
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            登録から面接のご相談まで、おおまかな流れはこの4ステップです。
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-rose-100 bg-white/90 p-4 shadow-sm md:mt-12">
          <p className="text-sm font-semibold text-rose-600">ご利用条件</p>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            <li>・18歳以上（高校生不可）</li>
            <li>・個人情報の取り扱いへの同意</li>
          </ul>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:gap-8">
          {STEPS.map((item) => (
            <article
              key={item.step}
              className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_16px_48px_-24px_rgba(0,0,0,0.12)]"
            >
              <div className="relative aspect-[16/10] bg-stone-50">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  className="object-contain object-bottom p-4"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute left-3 top-3 rounded-md bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                  {item.step}
                </span>
              </div>
              <div className="border-t border-stone-100 p-5 md:p-6">
                <h3 className="text-lg font-bold text-stone-900 md:text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-xl text-center">
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
          >
            今すぐ無料で診断をはじめる
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
