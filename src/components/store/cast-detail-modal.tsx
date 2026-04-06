"use client";

import { X } from "lucide-react";
import { RankBadge } from "@/components/ui/rank-badge";
import { Thumbnail } from "@/components/ui/thumbnail";
import { Button } from "@/components/ui/button";

interface CastDetailData {
  id: string;
  nickname: string;
  age: number;
  rank: string;
  photos: string[];
  description?: string | null;
  totalExperienceYears?: number | null;
  previousHourlyRate?: number | null;
  desiredAreas: string[];
  desiredHourlyRate?: number | null;
  desiredMonthlyIncome?: number | null;
  availableDaysPerWeek?: number | null;
  height?: number | null;
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  cupSize?: string | null;
  alcoholTolerance?: string | null;
  preferredAtmosphere?: string[] | null;
  preferredClientele?: string[] | null;
  isAvailableNow?: boolean | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shiftPreferences?: any;
  hasTattoo?: boolean | null;
  dressAvailability?: string | null;
  needsPickup?: boolean | null;
  hobbies?: string | null;
  specialSkills?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  languageSkills?: any;
  monthlySales?: number | null;
  monthlyNominations?: number | null;
  birthdaySales?: number | null;
  socialFollowers?: number | null;
  hasVipClients?: boolean | null;
  vipClientDescription?: string | null;
  birthdayEventWillingness?: boolean | null;
}

interface CastDetailModalProps {
  cast: CastDetailData | null;
  open: boolean;
  onClose: () => void;
  onOffer: (castId: string) => void;
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-[var(--text-sub)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-main)]">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}

export function CastDetailModal({ cast, open, onClose, onOffer }: CastDetailModalProps) {
  if (!open || !cast) return null;

  const photo = cast.photos[0] ?? null;
  const bodyInfo = [cast.height && `${cast.height}cm`, cast.cupSize, cast.bust && `B${cast.bust}`, cast.waist && `W${cast.waist}`, cast.hip && `H${cast.hip}`].filter(Boolean).join(" / ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-[var(--text-main)]">キャスト詳細</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* プロフィール概要 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {photo ? (
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-200">
                  <img src={photo} alt={cast.nickname} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Thumbnail src={null} alt={cast.nickname} fallbackType="user" className="!w-28 !h-28" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-bold text-[var(--text-main)]">{cast.nickname}</h4>
                <span className="text-sm text-[var(--text-sub)]">{cast.age}歳</span>
                <RankBadge rank={cast.rank} />
              </div>
              <p className="text-sm text-[var(--text-sub)] mb-2">
                {cast.totalExperienceYears != null && cast.totalExperienceYears > 0
                  ? `経験 ${cast.totalExperienceYears}年`
                  : "未経験"}
                {cast.previousHourlyRate != null && ` / 前店時給 ¥${cast.previousHourlyRate.toLocaleString()}`}
              </p>
              {cast.desiredAreas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cast.desiredAreas.map((area) => (
                    <span key={area} className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              {cast.isAvailableNow && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded font-medium">
                  即日勤務可
                </span>
              )}
            </div>
          </div>

          {/* 自己PR */}
          {cast.description && (
            <div>
              <h5 className="text-sm font-bold text-[var(--text-main)] mb-2">自己PR</h5>
              <p className="text-sm text-[var(--text-sub)] whitespace-pre-wrap leading-relaxed">{cast.description}</p>
            </div>
          )}

          {/* 希望条件 */}
          <div>
            <h5 className="text-sm font-bold text-[var(--text-main)] mb-2">希望条件</h5>
            <InfoRow label="希望時給" value={cast.desiredHourlyRate ? `¥${cast.desiredHourlyRate.toLocaleString()}` : null} />
            <InfoRow label="希望月収" value={cast.desiredMonthlyIncome ? `¥${cast.desiredMonthlyIncome.toLocaleString()}` : null} />
            <InfoRow label="出勤可能日数/週" value={cast.availableDaysPerWeek ? `${cast.availableDaysPerWeek}日` : null} />
            <InfoRow label="シフト希望" value={cast.shiftPreferences ? String(cast.shiftPreferences) : null} />
            <InfoRow label="希望雰囲気" value={cast.preferredAtmosphere?.join("、") ?? null} />
            <InfoRow label="希望客層" value={cast.preferredClientele?.join("、") ?? null} />
          </div>

          {/* スペック */}
          {bodyInfo && (
            <div>
              <h5 className="text-sm font-bold text-[var(--text-main)] mb-2">スペック</h5>
              <InfoRow label="スタイル" value={bodyInfo} />
              <InfoRow label="お酒" value={cast.alcoholTolerance} />
              <InfoRow label="タトゥー" value={cast.hasTattoo != null ? (cast.hasTattoo ? "あり" : "なし") : null} />
              <InfoRow label="ドレス" value={cast.dressAvailability === "OWNED" ? "あり" : cast.dressAvailability === "RENTAL" ? "レンタル" : null} />
              <InfoRow label="送迎" value={cast.needsPickup != null ? (cast.needsPickup ? "必要" : "不要") : null} />
            </div>
          )}

          {/* 実績 */}
          {(cast.monthlySales || cast.monthlyNominations || cast.birthdaySales) && (
            <div>
              <h5 className="text-sm font-bold text-[var(--text-main)] mb-2">実績</h5>
              <InfoRow label="月間売上" value={cast.monthlySales ? `¥${cast.monthlySales.toLocaleString()}` : null} />
              <InfoRow label="月間指名数" value={cast.monthlyNominations ? `${cast.monthlyNominations}件` : null} />
              <InfoRow label="バースデー売上" value={cast.birthdaySales ? `¥${cast.birthdaySales.toLocaleString()}` : null} />
              <InfoRow label="SNSフォロワー" value={cast.socialFollowers ? `${cast.socialFollowers.toLocaleString()}人` : null} />
            </div>
          )}

          {/* スキル */}
          {(cast.hobbies || cast.specialSkills || cast.languageSkills) && (
            <div>
              <h5 className="text-sm font-bold text-[var(--text-main)] mb-2">スキル・趣味</h5>
              <InfoRow label="趣味" value={cast.hobbies} />
              <InfoRow label="特技" value={cast.specialSkills} />
              <InfoRow label="語学" value={cast.languageSkills ? JSON.stringify(cast.languageSkills) : null} />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            閉じる
          </Button>
          <Button onClick={() => onOffer(cast.id)} className="flex-1">
            オファーを送る
          </Button>
        </div>
      </div>
    </div>
  );
}
