"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { lpLuminaAssets } from "@/lib/lp-assets";

const trustChips = ["診断無料", "匿名でスタートOK", "目安30秒"];

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden bg-[#fff5f7]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,113,133,0.28),transparent)]"
        aria-hidden
      />

      <header className="relative z-20 border-b border-rose-100/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Image.png" alt="LUMINA" width={132} height={40} priority />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="メイン">
            {session ? (
              <Link
                href={session.user.role === "STORE" ? "/s/dashboard" : "/c/dashboard"}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
              >
                {session.user.role === "STORE" ? "管理画面" : "マイページ"}
              </Link>
            ) : (
              <>
                <Link
                  href="/c/login"
                  className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-white/90 sm:px-4"
                >
                  ログイン
                </Link>
                <Link
                  href="/s/login"
                  className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition hover:border-rose-300 hover:text-rose-600"
                >
                  店舗の方
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Nomination 風: 2枚の白カードを並べたヒーロー */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <div className="flex flex-col rounded-3xl border border-white/90 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(244,63,94,0.2)] sm:p-8">
            <p className="text-sm font-medium text-rose-500">ナイトワークの求人を、スマホひとつで</p>
            <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              <span className="text-rose-500">夜職・ナイトワークの求人、</span>
              <br />
              はじめるなら LUMINA
            </h1>
            <p className="mt-5 text-pretty text-sm leading-relaxed text-stone-600 sm:text-base">
              未経験でも安心して始めやすいよう、AIがチャットでヒアリングし適正時給の目安をお伝えします。
              キャバクラ・クラブ・ラウンジなど掲載店舗を検索し、店舗からのオファーもアプリで受け取れます。
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {trustChips.map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/diagnosis"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 text-center text-base font-bold text-white shadow-lg shadow-rose-500/35 transition hover:bg-rose-600"
              >
                今すぐ無料で診断をはじめる
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {!session && (
                <Link
                  href="/c/login"
                  className="text-center text-sm font-semibold text-rose-600 underline-offset-4 hover:underline sm:text-left"
                >
                  すでに登録済みの方はログイン
                </Link>
              )}
            </div>

            <p className="mt-4 text-xs text-stone-500">
              スマートフォン・パソコンのブラウザからご利用いただけます。
            </p>

            <p className="mt-6 border-t border-stone-100 pt-6 text-sm text-stone-600">
              店舗掲載をご希望の方は{" "}
              <Link href="/s/register" className="font-semibold text-rose-600 underline-offset-2 hover:underline">
                求人掲載のお申し込み
              </Link>
              へ
            </p>
          </div>

          <div className="flex flex-col rounded-3xl border border-white/90 bg-white p-4 shadow-[0_24px_60px_-20px_rgba(244,63,94,0.15)] sm:p-6">
            <div className="relative min-h-[280px] flex-1 sm:min-h-[320px] lg:min-h-0">
              <Image
                src={lpLuminaAssets.heroMockup}
                alt="LUMINA を使う女性のイメージイラスト"
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
