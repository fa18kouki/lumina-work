import Image from "next/image";
import { lpLuminaAssets } from "@/lib/lp-assets";

function DevicePhoneMobileIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function AdjustmentsIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

function BellAlertIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const features = [
  {
    icon: DevicePhoneMobileIcon,
    title: "アプリで完全無料",
    description: "LINEなどでカンタンに登録・診断できます",
  },
  {
    icon: AdjustmentsIcon,
    title: "条件で絞り込み",
    description: "エリアや時給など詳細検索が可能",
  },
  {
    icon: BellAlertIcon,
    title: "オファーをアプリで確認",
    description: "店舗からの採用オファーを一覧で確認し、承諾・辞退できます",
  },
  {
    icon: UserCircleIcon,
    title: "プロフィールでアピール",
    description: "写真や希望条件を登録して、マッチしやすくなります",
  },
];

const APP_FEATURE_PHONES: { src: string; alt: string }[] = [
  { src: lpLuminaAssets.flow02AiChat, alt: "AIチャット診断の画面イメージ" },
  { src: lpLuminaAssets.flow04Stores, alt: "店舗検索の画面イメージ" },
  { src: lpLuminaAssets.flow05Offers, alt: "オファー一覧の画面イメージ" },
];

export function AppFeatures() {
  return (
    <section className="relative bg-gradient-to-br from-pink-500 via-pink-400 to-purple-400 py-20 md:py-32 overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-white rounded-full blur-3xl opacity-10" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-white/20 text-white px-6 py-2 rounded-full text-base font-semibold mb-6">
            Application
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            使いやすいアプリで
            <br />
            スムーズにお仕事探し
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/95 rounded-2xl p-6 shadow-xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center shadow-lg">
                <feature.icon />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Phone mockups */}
        <div className="flex justify-center gap-6 overflow-x-auto pb-2">
          {APP_FEATURE_PHONES.map((phone) => (
            <div
              key={phone.src}
              className="w-48 md:w-52 bg-white rounded-3xl shadow-2xl p-3 flex-shrink-0"
            >
              <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
                <Image
                  src={phone.src}
                  alt={phone.alt}
                  fill
                  className="object-contain object-bottom p-2"
                  sizes="(max-width: 768px) 192px, 208px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
