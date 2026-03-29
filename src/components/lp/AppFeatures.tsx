import Image from "next/image";
import { lpLuminaAssets } from "@/lib/lp-assets";

function DevicePhoneMobileIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function AdjustmentsIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}

function BellAlertIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const features = [
  {
    icon: DevicePhoneMobileIcon,
    title: "無料で診断からスタート",
    description: "LINEなどでログインし、チャット診断を無料で利用できます。",
  },
  {
    icon: AdjustmentsIcon,
    title: "条件で店舗を検索",
    description: "エリア・時給など、希望に近い店舗を探せます。",
  },
  {
    icon: BellAlertIcon,
    title: "オファーをアプリで管理",
    description: "届いたオファーを一覧で確認し、承諾・辞退ができます。",
  },
  {
    icon: UserCircleIcon,
    title: "プロフィールで魅力を伝える",
    description: "写真や希望条件を登録して、マッチの精度を高められます。",
  },
];

const APP_FEATURE_PHONES: { src: string; alt: string; caption: string }[] = [
  { src: lpLuminaAssets.flow02AiChat, alt: "AIチャット診断の画面イメージ", caption: "チャット診断" },
  { src: lpLuminaAssets.flow04Stores, alt: "店舗検索の画面イメージ", caption: "店舗検索" },
  { src: lpLuminaAssets.flow05Offers, alt: "オファー一覧の画面イメージ", caption: "オファー" },
];

export function AppFeatures() {
  return (
    <section className="relative overflow-hidden border-t border-rose-100/60 bg-gradient-to-b from-violet-50/40 via-white to-rose-50/30 py-16 md:py-24">
      <div
        className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 rounded-full bg-rose-200/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 rounded-full bg-violet-200/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-rose-500">アプリでできること</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            スマホひとつで、探す・診断・オファー確認まで
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            主な機能と、実際の画面イメージをセットでご覧ください。
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25">
                <feature.icon />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-stone-900 md:text-base">{feature.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 md:text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <p className="mb-6 text-center text-sm font-semibold text-stone-500">画面イメージ</p>
          <div className="flex flex-wrap items-end justify-center gap-6 md:gap-10">
            {APP_FEATURE_PHONES.map((phone, i) => (
              <figure
                key={phone.src}
                className="flex w-[min(100%,260px)] flex-col items-center md:w-[min(100%,280px)]"
              >
                <div
                  className={`relative w-full rounded-[1.75rem] border-[6px] border-white bg-stone-100 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] ${i === 1 ? "md:-translate-y-3" : ""}`}
                  style={{ aspectRatio: "10/19" }}
                >
                  <Image
                    src={phone.src}
                    alt={phone.alt}
                    fill
                    className="rounded-[1.25rem] object-contain object-bottom p-2"
                    sizes="(max-width: 768px) 260px, 280px"
                  />
                </div>
                <figcaption className="mt-3 text-center text-sm font-medium text-stone-700">
                  {phone.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
