"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import {
  ChevronLeft,
  Heart,
  EyeOff,
  Eye,
  MapPin,
  Clock,
  Smile,
  Check,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { getAreaLocation } from "@/lib/areas";

const DEFAULT_IMAGE = "/service-scene-10.png";

function formatDisplayAddress(address: string, area: string): string {
  if (address.trim()) return address;
  const loc = getAreaLocation(area);
  if (!loc) return "住所未登録";
  return [loc.prefecture, loc.city, `${loc.area}エリア`].filter(Boolean).join(" ");
}

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
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
      if (status === "unauthenticated") router.push("/c/login");
      else if (session?.user.role !== "CAST") router.push("/c/login");
    }
  }, [session, status, router]);

  const storeId = params.id as string;
  const { data: store, isLoading: storeLoading } = trpc.cast.getStoreDetail.useQuery({ storeId });
  const { data: blockStatus } = trpc.cast.isStoreBlocked.useQuery({ storeId });
  const { data: applicationStatus } = trpc.cast.getApplicationStatus.useQuery({ storeId });
  const utils = trpc.useUtils();

  const applyMutation = trpc.cast.applyToStore.useMutation({
    onSuccess: () => {
      utils.cast.getApplicationStatus.invalidate({ storeId });
      setShowApplyConfirm(false);
    },
  });

  const blockMutation = trpc.cast.blockStore.useMutation({
    onSuccess: () => {
      utils.cast.isStoreBlocked.invalidate({ storeId });
    },
  });
  const unblockMutation = trpc.cast.unblockStore.useMutation({
    onSuccess: () => {
      utils.cast.isStoreBlocked.invalidate({ storeId });
    },
  });

  const isBlocked = blockStatus?.blocked ?? false;

  const handleToggleBlock = () => {
    if (isBlocked) {
      unblockMutation.mutate({ storeId });
    } else {
      if (window.confirm("この店舗をブロックしますか？\nブロックすると、この店舗にあなたが表示されなくなります。")) {
        blockMutation.mutate({ storeId });
      }
    }
  };

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

  const storeData = store as typeof store & { bannerUrl?: string | null; logoUrl?: string | null };
  const imageUrl = storeData.bannerUrl
    ?? (store.photos as string[] | null)?.[0]
    ?? DEFAULT_IMAGE;

  return (
    <div className="flex flex-col min-h-full bg-(--bg-gray) -m-4 md:-m-8">
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
          <div className="flex gap-2">
            <button
              onClick={handleToggleBlock}
              disabled={blockMutation.isPending || unblockMutation.isPending}
              className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center ${
                isBlocked
                  ? "bg-red-500/70 text-white"
                  : "bg-white/30 text-white"
              }`}
              title={isBlocked ? "ブロック解除" : "みちゃだめ"}
            >
              {isBlocked ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
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
      </div>

      {/* コンテンツカード */}
      <div className="relative bg-white rounded-t-[30px] -mt-10 flex-1 pb-4">
        {storeData.logoUrl && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-md bg-white">
            <Image src={storeData.logoUrl} alt={`${store.name} ロゴ`} fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className={`px-6 ${storeData.logoUrl ? "pt-12" : "pt-8"}`}>
          {/* ヘッダー情報 */}
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-(--text-main) mb-2">
              {store.name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-(--text-sub) text-sm mb-3">
              <MapPin className="w-4 h-4 text-(--primary)" />
              <span>{formatDisplayAddress(store.address, store.area)}</span>
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
      <div className="sticky bottom-0 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3 z-40">
        {applicationStatus?.applied ? (
          <button
            disabled
            className="flex-1 h-12 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold text-sm gap-2"
          >
            <Check className="w-4 h-4" />
            応募済み
          </button>
        ) : (
          <button
            onClick={() => setShowApplyConfirm(true)}
            disabled={applyMutation.isPending}
            className="flex-1 h-12 bg-gradient-to-r from-[#FF69B4] to-[#FF8DA1] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-[0_4px_12px_rgba(255,105,180,0.3)] disabled:opacity-50"
          >
            {applyMutation.isPending ? "送信中..." : "応募する"}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showApplyConfirm}
        title="この店舗に応募しますか？"
        description={`「${store.name}」に応募します。店舗側があなたのプロフィールを確認し、承認・辞退を行います。`}
        confirmLabel="応募する"
        cancelLabel="キャンセル"
        onConfirm={() => applyMutation.mutate({ storeId })}
        onCancel={() => setShowApplyConfirm(false)}
      />
    </div>
  );
}
