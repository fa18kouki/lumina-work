import Image from "next/image";
import { SectionHeader } from "./SectionHeader";
import { lpLuminaAssets } from "@/lib/lp-assets";

function SparklesIcon() {
  return (
    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

const steps = [
  {
    number: "01",
    badge: "情報登録",
    title: "プロフィールとログイン",
    description:
      "基本情報や希望条件を入力し、SNSアカウントでかんたんにログインできます。",
    icon: SparklesIcon,
    align: "right" as const,
    image: lpLuminaAssets.servicePoint1,
    imageAlt: "AI診断・登録のイメージ",
  },
  {
    number: "02",
    badge: "AIチャット診断",
    title: "チャット形式のAI診断",
    description:
      "テキストのチャットで質問に答えていくと、適正時給などの診断結果が表示されます。",
    icon: ChatBubbleIcon,
    align: "left" as const,
    image: lpLuminaAssets.servicePoint2,
    imageAlt: "条件検索のイメージ",
  },
  {
    number: "03",
    badge: "結果とお店探し",
    title: "お店を探してオファーを待つ",
    description:
      "エリアや時給などで店舗を検索し、気になる店舗から届く採用オファーをアプリで確認できます。",
    icon: ShieldCheckIcon,
    align: "right" as const,
    image: lpLuminaAssets.servicePoint3,
    imageAlt: "オファー通知のイメージ",
  },
];

export function ServiceSteps() {
  return (
    <section className="relative bg-white py-20 md:py-32 overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          tag="Service"
          title="3つのポイント"
          subtitle="あなたの不安を解消する、安心のサポート体制"
        />

        <div className="mt-16 space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col ${step.align === "left" ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-8`}
            >
              {/* Number with icon */}
              <div className="relative flex-shrink-0">
                <span className="text-8xl md:text-9xl font-bold text-pink-100 select-none">
                  {step.number}
                </span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center shadow-xl">
                    <step.icon />
                  </div>
                </div>
              </div>

              {/* Content card */}
              <div className="flex-1 bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-3xl overflow-hidden shadow-lg">
                <div className="relative aspect-[16/9] w-full bg-white/60 md:hidden">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    className="object-contain p-4"
                    sizes="100vw"
                  />
                </div>
                <div className="p-8 md:p-10 md:flex md:gap-8 md:items-center">
                  <div className="relative hidden md:block w-52 h-52 shrink-0 rounded-2xl overflow-hidden bg-white shadow-inner">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className="object-cover"
                      sizes="208px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block bg-pink-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                      {step.badge}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
