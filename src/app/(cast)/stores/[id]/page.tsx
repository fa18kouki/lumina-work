"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import {
  ChevronLeft,
  Heart,
  MapPin,
  Clock,
  Smile,
  MessageCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";

const DEFAULT_IMAGE = "/service-scene-10.png";

function formatSalary(salarySystem: unknown): string {
  if (!salarySystem) return "応相談";
  if (typeof salarySystem === "string") return salarySystem;
  const sys = salarySystem as Record<string, number>;
  if (sys.hourlyRateMin) {
    return `時給 ${sys.hourlyRateMin.toLocaleString()}円〜`;
  }
  return "応相談";
}

type Tab = "details" | "photos" | "reviews";

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useAppSession();
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
      if (status === "unauthenticated") router.push("/login");
      else if (session?.user.role !== "CAST") router.push("/login");
    }
  }, [session, status, router]);

  const storeId = params.id as string;
  const { data: store, isLoading: storeLoading } = trpc.cast.getStoreDetail.useQuery({ storeId });

  if (status === "loading" || storeLoading || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-(--text-sub)">店舗が見つかりませんでした</p>
      </div>
    );
  }

  const imageUrl = (store.photos as string[] | null)?.[0] ?? DEFAULT_IMAGE;

  return (
    <div className="min-h-screen bg-(--bg-gray) -m-4 md:-m-8">
      {/* ヒーロー画像 */}
      <div className="relative h-[200px] sm:h-[280px] w-full">
        <Image
          src={imageUrl}
          alt={store.name}
          fill
          className="object-cover"
          priority
        />
        {/* オーバーレイボタン */}
        <div className="absolute top-12 left-0 right-0 px-5 flex justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <Heart
              className={`w-5 h-5 ${liked ? "fill-white" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* コンテンツカード */}
      <div className="relative bg-white rounded-t-[30px] -mt-10 min-h-[calc(100vh-240px)] pb-28">
        <div className="px-6 pt-8">
          {/* ヘッダー情報 */}
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-(--text-main) mb-2">
              {store.name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-(--text-sub) text-sm mb-3">
              <MapPin className="w-4 h-4 text-(--primary)" />
              <span>東京都{store.area}区 X-X-X</span>
            </div>
            <span className="inline-block px-5 py-1.5 bg-(--primary-bg) text-(--primary) text-2xl font-bold rounded-full">
              {formatSalary(store.salarySystem)}
            </span>
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-100 mb-6">
            {[
              { id: "details" as Tab, label: "詳細" },
              { id: "photos" as Tab, label: "写真" },
              { id: "reviews" as Tab, label: "口コミ" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 pb-3 text-sm font-medium relative ${
                  activeTab === tab.id
                    ? "text-(--primary) font-bold"
                    : "text-(--text-sub)"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/4 w-1/2 h-[3px] bg-(--primary) rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* タブコンテンツ */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* お店の特徴 */}
              <section>
                <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
                  お店の特徴
                </h2>
                <p className="text-sm leading-relaxed text-(--text-sub)">
                  {store.description ?? "詳細情報はまだ登録されていません。"}
                </p>
              </section>

              {/* 勤務条件 */}
              <section>
                <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
                  勤務条件
                </h2>
                {store.businessHours && (
                  <div className="flex items-center gap-2.5 text-sm text-(--text-main) mb-2.5">
                    <Clock className="w-4 h-4 text-(--primary)" />
                    <span>{store.businessHours}</span>
                  </div>
                )}
                <ul className="space-y-2.5">
                  {((store.benefits as string[] | null) ?? []).map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2.5 text-sm text-(--text-main)"
                    >
                      <Smile className="w-4 h-4 text-(--primary)" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="text-center py-12">
              <p className="text-(--text-sub)">写真はまだ登録されていません</p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="text-center py-12">
              <p className="text-(--text-sub)">口コミはまだありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 固定CTAフッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3 z-50">
        <Link
          href="/matches"
          className="flex-1 h-12 sm:h-[54px] border-2 border-(--primary) text-(--primary) rounded-full flex items-center justify-center font-bold text-sm sm:text-base"
        >
          <MessageCircle className="w-5 h-5 mr-1.5" />
          相談
        </Link>
        <button className="flex-1 h-12 sm:h-[54px] bg-gradient-to-r from-[#FF69B4] to-[#FF8DA1] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base shadow-[0_4px_12px_rgba(255,105,180,0.3)]">
          応募する
        </button>
      </div>
    </div>
  );
}
