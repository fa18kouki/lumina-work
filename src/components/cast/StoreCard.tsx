"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart, Train } from "lucide-react";
import { useState } from "react";

interface StoreCardProps {
  id: string;
  name: string;
  area: string;
  salary: string;
  imageUrl: string;
  logoUrl?: string;
  tags?: string[];
  storeType?: string | null;
  nearestStation?: string | null;
  walkMinutes?: number | null;
  featureTags?: string[];
  variant?: "horizontal" | "vertical";
}

const STORE_TYPE_LABELS: Record<string, string> = {
  CABARET: "キャバクラ",
  CLUB: "クラブ",
  LOUNGE: "ラウンジ",
  GIRLS_BAR: "ガールズバー",
  SNACK: "スナック",
  OTHER: "その他",
};

// おすすめ店舗用（縦型カード）
function VerticalStoreCard({
  id,
  name,
  area,
  salary,
  imageUrl,
  logoUrl,
  storeType,
  nearestStation,
  walkMinutes,
}: Omit<StoreCardProps, "variant" | "tags" | "featureTags">) {
  return (
    <Link
      href={`/c/stores/${id}`}
      className="min-w-[260px] bg-white rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] flex-shrink-0"
    >
      <div className="relative h-[140px] w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="260px"
        />
        {storeType && STORE_TYPE_LABELS[storeType] && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded">
            {STORE_TYPE_LABELS[storeType]}
          </span>
        )}
        {logoUrl && (
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white">
            <Image src={logoUrl} alt="" fill className="object-cover" sizes="32px" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-(--text-main) mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-1">
          <MapPin className="w-3 h-3" />
          <span>{area}</span>
        </div>
        {nearestStation && (
          <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-2">
            <Train className="w-3 h-3" />
            <span>{nearestStation}{walkMinutes ? ` 徒歩${walkMinutes}分` : ""}</span>
          </div>
        )}
        <p className="text-base font-bold text-(--primary)">{salary}</p>
      </div>
    </Link>
  );
}

// 検索結果用（横型カード）
function HorizontalStoreCard({
  id,
  name,
  area,
  salary,
  imageUrl,
  logoUrl,
  tags = [],
  storeType,
  nearestStation,
  walkMinutes,
  featureTags = [],
}: Omit<StoreCardProps, "variant">) {
  const [liked, setLiked] = useState(false);

  const allTags = [...featureTags, ...tags].slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-[var(--shadow-card)] relative">
      <Link href={`/c/stores/${id}`} className="flex gap-3 flex-1">
        <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="100px"
          />
          {storeType && STORE_TYPE_LABELS[storeType] && (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-medium rounded">
              {STORE_TYPE_LABELS[storeType]}
            </span>
          )}
          {logoUrl && (
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white">
              <Image src={logoUrl} alt="" fill className="object-cover" sizes="28px" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 py-1">
          <div>
            <h3 className="text-[15px] font-bold text-(--text-main) mb-1">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-0.5">
              <MapPin className="w-3 h-3" />
              <span>{area}</span>
            </div>
            {nearestStation && (
              <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-1">
                <Train className="w-3 h-3" />
                <span>{nearestStation}{walkMinutes ? ` 徒歩${walkMinutes}分` : ""}</span>
              </div>
            )}
            <p className="text-[15px] font-bold text-(--primary) mb-1.5">
              {salary}
            </p>
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-(--primary-bg) text-(--primary) rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          setLiked(!liked);
        }}
        className="absolute top-3 right-3"
      >
        <Heart
          className={`w-5 h-5 ${
            liked ? "fill-(--primary) text-(--primary)" : "text-gray-300"
          }`}
        />
      </button>
    </div>
  );
}

export function StoreCard({ variant = "vertical", ...props }: StoreCardProps) {
  if (variant === "horizontal") {
    return <HorizontalStoreCard {...props} />;
  }
  return <VerticalStoreCard {...props} />;
}
