import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/ui/rank-badge";
import { Thumbnail } from "@/components/ui/thumbnail";

interface ApplicantListItemProps {
  cast: {
    id: string;
    nickname: string;
    age: number;
    photos: string[];
    desiredAreas: string[];
    rank: string;
    totalExperienceYears?: number | null;
    previousHourlyRate?: number | null;
    createdAt?: string | Date | null;
  };
  onDetail: (castId: string) => void;
  onOffer: (castId: string) => void;
}

function isNew(createdAt?: string | Date | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs < 7 * 24 * 60 * 60 * 1000;
}

export function ApplicantListItem({ cast, onDetail, onOffer }: ApplicantListItemProps) {
  const photo = cast.photos[0] ?? null;
  const showNew = isNew(cast.createdAt);

  return (
    <div
      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onDetail(cast.id)}
    >
      {/* 写真 */}
      <div className="flex-shrink-0">
        {photo ? (
          <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-200">
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
            size="md"
            shape="square"
            fallbackType="user"
            className="!w-[60px] !h-[60px]"
          />
        )}
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        {/* 1行目: 名前・年齢・ランク・新着 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-(--text-main) truncate">
            {cast.nickname}
          </span>
          <span className="text-sm text-(--text-sub) flex-shrink-0">
            {cast.age}歳
          </span>
          <RankBadge rank={cast.rank} className="flex-shrink-0" />
          {showNew && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded flex-shrink-0">
              NEW
            </span>
          )}
        </div>

        {/* 2行目: 経験・時給 */}
        <p className="text-sm text-(--text-sub) mt-0.5">
          {cast.totalExperienceYears != null && cast.totalExperienceYears > 0
            ? `経験${cast.totalExperienceYears}年`
            : "未経験"}
          {cast.previousHourlyRate != null && (
            <> / 時給 ¥{cast.previousHourlyRate.toLocaleString()}</>
          )}
        </p>

        {/* 3行目: エリアタグ */}
        {cast.desiredAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {cast.desiredAreas.slice(0, 4).map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded"
              >
                {area}
              </span>
            ))}
            {cast.desiredAreas.length > 4 && (
              <span className="px-2 py-0.5 text-(--text-sub) text-xs">
                +{cast.desiredAreas.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onOffer(cast.id);
          }}
          size="sm"
        >
          オファー
        </Button>
      </div>
    </div>
  );
}
