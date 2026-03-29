"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { lpLuminaAssets } from "@/lib/lp-assets";

const trustChips = ["診断は無料", "まずは匿名でOK", "所要時間の目安30秒"];

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-[#fff5f7]">
      {/* 背景グラデーション（国内LP風の柔らかい色面） */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_-10%,rgba(251,113,133,0.35),transparent),radial-gradient(ellipse_80%_60%_at_0%_100%,rgba(196,181,253,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-20 h-64 w-64 rounded-full bg-violet-200/35 blur-3xl"
        aria-hidden
      />

      <header className="relative z-20 border-b border-rose-100/60 bg-white/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Image.png" alt="LUMINA" width={132} height={40} priority />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <Link
                href={session.user.role === "STORE" ? "/s/dashboard" : "/c/dashboard"}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-600"
              >
                {session.user.role === "STORE" ? "管理画面" : "マイページ"}
              </Link>
            ) : (
              <>
                <Link
                  href="/c/login"
                  className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-white/80 sm:px-4"
                >
                  ログイン
                </Link>
                <Link
                  href="/s/login"
                  className="rounded-full border border-stone-200/80 bg-white/60 px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-rose-200 hover:text-rose-600"
                >
                  店舗の方
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1fr_min(42%,420px)] lg:items-center lg:gap-12 lg:pb-28 lg:pt-14">
        <div className="order-2 lg:order-1">
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.18)] backdrop-blur-sm sm:p-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm sm:text-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
              キャバクラ・クラブのお仕事探し
            </p>

            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
              今の時給、
              <span className="mt-1 block bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
                もっと貰えるかも。
              </span>
            </h1>

            <p className="mt-5 text-pretty text-base leading-relaxed text-stone-600 sm:text-lg">
              AIがチャットでヒアリングし、あなたの適正時給の目安を診断。
              希望条件に近い店舗を探して、オファーを受け取れます。
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {trustChips.map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-rose-100 bg-rose-50/90 px-3 py-1.5 text-xs font-medium text-rose-800 sm:text-sm"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
              >
                AI時給診断をはじめる
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="text-center text-xs text-stone-500 sm:text-left sm:text-sm">
                会員登録は診断後でもOKです
              </p>
            </div>
          </div>
        </div>

        <div className="relative order-1 flex justify-center lg:order-2 lg:justify-end">
          <div
            className="relative w-full max-w-[320px] sm:max-w-[380px]"
            style={{ aspectRatio: "4/5" }}
          >
            <div
              className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-white/90 to-rose-50/50 shadow-inner ring-1 ring-rose-100/80"
              aria-hidden
            />
            <div className="relative h-full w-full rotate-[-1.5deg] transition duration-500 hover:rotate-0">
              <Image
                src={lpLuminaAssets.heroMockup}
                alt="スマホでLUMINAの診断・求人を利用するイメージ"
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                sizes="(max-width: 1024px) 90vw, 380px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
