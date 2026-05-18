"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/ui/rank-badge";
import { Thumbnail } from "@/components/ui/thumbnail";

interface CastCardProps {
  cast: {
    id: string;
    nickname: string;
    age: number | null;
    photos: string[];
    desiredAreas: string[];
    rank: string;
    description?: string | null;
    totalExperienceYears?: number | null;
    previousHourlyRate?: number | null;
    user?: { image: string | null } | null;
  };
  onDetail: (castId: string) => void;
  onOffer: (castId: string) => void;
}

const THUMB_SLOT_COUNT = 2;

export function CastCard({ cast, onDetail, onOffer }: CastCardProps) {
  const photos = useMemo(() => {
    if (cast.photos.length > 0) return cast.photos;
    if (cast.user?.image) return [cast.user.image];
    return [];
  }, [cast.photos, cast.user?.image]);

  const [mainIndex, setMainIndex] = useState(0);
  // cast 切り替え時に mainIndex を先頭に戻す (CastDetailModal と振る舞いを揃える)
  useEffect(() => {
    setMainIndex(0);
  }, [cast.id]);

  const safeMainIndex = mainIndex < photos.length ? mainIndex : 0;
  const mainPhoto = photos[safeMainIndex] ?? null;

  // メイン以外の photos インデックス (順序維持)
  const subIndices = photos.map((_, i) => i).filter((i) => i !== safeMainIndex);
  const totalSub = subIndices.length;
  const showThumbnails = totalSub >= 1;
  const showMoreBadge = totalSub > THUMB_SLOT_COUNT;
  const visibleThumbIndices = showMoreBadge
    ? subIndices.slice(0, THUMB_SLOT_COUNT - 1)
    : subIndices.slice(0, THUMB_SLOT_COUNT);
  // 「+N」: メイン+サムネ表示分以外の枚数
  const moreCount = photos.length - 1 - visibleThumbIndices.length;

  return (
    <Card className="overflow-hidden">
      <div className="flex p-4 gap-4">
        {/* 画像エリア (メイン + サムネ縦列) */}
        <div className="flex-shrink-0 flex gap-2">
          {/* メイン */}
          {mainPhoto ? (
            <button
              type="button"
              data-testid="cast-card-main-button"
              onClick={() => onDetail(cast.id)}
              className="block w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-lg overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label={`${cast.nickname}の写真を拡大`}
            >
              <img
                data-testid="cast-card-main-image"
                src={mainPhoto}
                alt={cast.nickname}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <Thumbnail
              src={null}
              alt={cast.nickname}
              fallbackType="user"
              className="!w-24 !h-24 sm:!w-[120px] sm:!h-[120px]"
            />
          )}

          {/* サムネ縦列 */}
          {showThumbnails && (
            <div
              data-testid="cast-card-thumbnails"
              className="flex flex-col gap-2"
            >
              {visibleThumbIndices.map((photoIdx) => (
                <button
                  key={photoIdx}
                  type="button"
                  onClick={() => setMainIndex(photoIdx)}
                  className="block w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-md overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  aria-label={`${cast.nickname}の写真 ${photoIdx + 1} 枚目`}
                >
                  <img
                    src={photos[photoIdx]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {showMoreBadge && (
                <button
                  type="button"
                  data-testid="cast-card-more-badge"
                  onClick={() => onDetail(cast.id)}
                  className="relative block w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-md overflow-hidden bg-slate-900/80 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                  aria-label={`${cast.nickname}の写真をすべて見る`}
                >
                  +{moreCount}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ヘッダー: 名前・年齢・ランク */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-(--text-main) truncate">
              {cast.nickname}
            </h3>
            {cast.age != null && (
              <span className="text-sm text-(--text-sub) flex-shrink-0">
                {cast.age}歳
              </span>
            )}
            <RankBadge rank={cast.rank} className="flex-shrink-0" />
          </div>

          {/* 経験・時給 */}
          <p className="text-sm text-(--text-sub) mb-1">
            {cast.totalExperienceYears != null && cast.totalExperienceYears > 0
              ? `経験 ${cast.totalExperienceYears}年`
              : "未経験"}
            {cast.previousHourlyRate != null && (
              <> / 時給 ¥{cast.previousHourlyRate.toLocaleString()}</>
            )}
          </p>

          {/* エリアタグ */}
          {cast.desiredAreas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {cast.desiredAreas.slice(0, 3).map((area) => (
                <span
                  key={area}
                  className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded"
                >
                  {area}
                </span>
              ))}
              {cast.desiredAreas.length > 3 && (
                <span className="px-2 py-0.5 text-(--text-sub) text-xs">
                  +{cast.desiredAreas.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 説明文 */}
          {cast.description && (
            <p className="text-sm text-(--text-sub) line-clamp-2 mb-2">
              {cast.description}
            </p>
          )}

          {/* ボタン */}
          <div className="mt-auto flex justify-end gap-2">
            <Button onClick={() => onDetail(cast.id)} variant="outline" size="sm">
              詳細を見る
            </Button>
            <Button onClick={() => onOffer(cast.id)} size="sm">
              オファーを送る
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
