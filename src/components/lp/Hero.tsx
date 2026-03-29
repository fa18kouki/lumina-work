"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { lpLuminaAssets } from "@/lib/lp-assets";

const trustChips = ["診断無料", "匿名でスタートOK", "目安30秒"];

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative">
      <div className="relative min-h-[min(88vh,760px)] w-full overflow-hidden bg-stone-900 lg:min-h-[640px]">
        <Image
          src={lpLuminaAssets.heroBanner}
          alt="ナイトワーク求人サービス LUMINA のイメージ"
          fill
          priority
          className="object-cover object-[80%_center] sm:object-[70%_center] lg:object-[60%_center]"
          sizes="100vw"
        />
        {/* モバイル: 下寄せで文字可読 / デスクトップ: 左に読みやすい帯 */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/45 lg:to-black/10"
          aria-hidden
        />

        <header className="absolute inset-x-0 top-0 z-30 border-b border-white/[0.12] bg-white/[0.07] backdrop-blur-2xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-white/90 px-3 py-1.5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.35)] ring-1 ring-white/70 backdrop-blur-md transition hover:bg-white hover:ring-white"
            >
              <Image src="/Image.png" alt="LUMINA" width={132} height={40} priority />
            </Link>

            <nav className="flex items-center gap-2 sm:gap-3" aria-label="メイン">
              {session ? (
                <Link
                  href={session.user.role === "STORE" ? "/s/dashboard" : "/c/dashboard"}
                  className="rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-4px_rgba(225,29,72,0.55)] ring-1 ring-white/25 transition hover:bg-rose-600"
                >
                  {session.user.role === "STORE" ? "管理画面" : "マイページ"}
                </Link>
              ) : (
                <>
                  <Link
                    href="/c/login"
                    className="rounded-full bg-white/90 px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.4)] ring-1 ring-white/60 backdrop-blur-md transition hover:bg-white sm:px-5"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/s/login"
                    className="rounded-full bg-white/88 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] ring-1 ring-rose-200/70 backdrop-blur-md transition hover:bg-white hover:ring-rose-300/80 sm:px-5"
                  >
                    店舗の方
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[min(88vh,760px)] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:justify-center sm:pb-20 sm:pt-28 lg:min-h-[640px] lg:justify-center lg:pb-24 lg:pt-32">
          <div className="max-w-xl">
            <p className="text-sm font-medium tracking-wide text-rose-200">
              ナイトワークの求人を、スマホひとつで
            </p>
            <h1 className="mt-3 text-balance text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
              <span className="text-rose-300">夜職・ナイトワークの求人、</span>
              <br />
              はじめるなら LUMINA
            </h1>
            <p className="mt-5 text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
              AIがチャットでヒアリングし、適正時給の目安をお伝えします。キャバクラ・クラブ・ラウンジなどを検索し、店舗からのオファーも受け取れます。
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {trustChips.map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm sm:text-sm"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 text-center text-base font-bold text-white shadow-lg shadow-rose-900/40 transition hover:bg-rose-400"
              >
                今すぐ無料で診断をはじめる
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {!session && (
                <Link
                  href="/c/login"
                  className="text-center text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white sm:text-left"
                >
                  すでに登録済みの方はログイン
                </Link>
              )}
            </div>

            <p className="mt-4 text-xs text-white/65">
              スマートフォン・パソコンのブラウザからご利用いただけます。
            </p>

            <p className="mt-6 border-t border-white/15 pt-6 text-sm text-white/80">
              店舗掲載をご希望の方は{" "}
              <Link href="/s/register" className="font-semibold text-rose-200 underline-offset-2 hover:underline">
                求人掲載のお申し込み
              </Link>
              へ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
