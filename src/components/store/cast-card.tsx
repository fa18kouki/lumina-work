import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/ui/rank-badge";
import { Thumbnail } from "@/components/ui/thumbnail";

interface CastCardProps {
  cast: {
    id: string;
    nickname: string;
    age: number;
    photos: string[];
    desiredAreas: string[];
    rank: string;
    description?: string | null;
    totalExperienceYears?: number | null;
    previousHourlyRate?: number | null;
  };
  onDetail: (castId: string) => void;
  onOffer: (castId: string) => void;
}

export function CastCard({ cast, onDetail, onOffer }: CastCardProps) {
  const photo = cast.photos[0] ?? null;

  return (
    <Card className="overflow-hidden">
      <div className="flex p-4 gap-4">
        {/* 画像 */}
        <div className="flex-shrink-0">
          {photo ? (
            <div className="w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-lg overflow-hidden bg-gray-200">
              <img
                src={photo}
                alt={cast.nickname}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Thumbnail
              src={null}
              alt={cast.nickname}
              fallbackType="user"
              className="!w-24 !h-24 sm:!w-[120px] sm:!h-[120px]"
            />
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ヘッダー: 名前・年齢・ランク */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-(--text-main) truncate">
              {cast.nickname}
            </h3>
            <span className="text-sm text-(--text-sub) flex-shrink-0">
              {cast.age}歳
            </span>
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
