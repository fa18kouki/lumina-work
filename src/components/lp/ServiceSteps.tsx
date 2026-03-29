import Image from "next/image";
import { lpLuminaAssets } from "@/lib/lp-assets";

const steps = [
  {
    number: "01",
    badge: "登録・プロフィール",
    title: "まずは無料でAI診断",
    description:
      "基本情報や希望条件を入力し、LINEなどでログイン。チャット形式の質問に答えると診断結果がわかります。",
    image: lpLuminaAssets.servicePoint1,
    imageAlt: "無料AI診断のイメージ",
  },
  {
    number: "02",
    badge: "店舗検索",
    title: "条件でお店を探せる",
    description:
      "エリアや時給などで絞り込み。気になる店舗の待遇や雰囲気を、アプリ上で比較しやすくなっています。",
    image: lpLuminaAssets.servicePoint2,
    imageAlt: "条件検索のイメージ",
  },
  {
    number: "03",
    badge: "オファー",
    title: "店舗からオファーが届く",
    description:
      "あなたのプロフィールに興味を持った店舗から、採用オファーが届きます。内容を確認して承諾・辞退を選べます。",
    image: lpLuminaAssets.servicePoint3,
    imageAlt: "オファー通知のイメージ",
  },
];

export function ServiceSteps() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-rose-500">LUMINAの特長</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            3つだけおさえておきたいポイント
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            イラストとあわせて、サービスの魅力をかんたんにご紹介します。
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-50/40 shadow-[0_16px_48px_-20px_rgba(244,63,94,0.15)] transition hover:border-rose-200/80 hover:shadow-[0_20px_50px_-18px_rgba(244,63,94,0.22)]"
            >
              <div className="relative aspect-square bg-white">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute left-3 top-3 rounded-full bg-stone-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {step.number}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <span className="inline-flex w-fit rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
                  {step.badge}
                </span>
                <h3 className="mt-3 text-lg font-bold text-stone-900 md:text-xl">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600 md:text-[0.9375rem]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
