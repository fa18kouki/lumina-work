"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";
import { useState } from "react";

interface StoreCardProps {
  id: string;
  name: string;
  area: string;
  salary: string;
  imageUrl: string;
  tags?: string[];
  variant?: "horizontal" | "vertical";
}

// おすすめ店舗用（縦型カード）
function VerticalStoreCard({
  id,
  name,
  area,
  salary,
  imageUrl,
}: Omit<StoreCardProps, "variant" | "tags">) {
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
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-(--text-main) mb-1">{name}</h3>
        <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-2">
          <MapPin className="w-3 h-3" />
          <span>{area}</span>
        </div>
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
  tags = [],
}: Omit<StoreCardProps, "variant">) {
  const [liked, setLiked] = useState(false);

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
        </div>
        <div className="flex flex-col justify-between flex-1 py-1">
          <div>
            <h3 className="text-[15px] font-bold text-(--text-main) mb-1">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-(--text-sub) text-xs mb-1">
              <MapPin className="w-3 h-3" />
              <span>{area}</span>
            </div>
            <p className="text-[15px] font-bold text-(--primary) mb-1.5">
              {salary}
            </p>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tags.slice(0, 2).map((tag) => (
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
