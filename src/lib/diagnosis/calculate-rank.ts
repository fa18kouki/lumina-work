/**
 * 診断回答からキャストランクを計算する純粋関数。
 * クライアント・サーバー両方で利用するため "use client" を含めない。
 */

export type CastRank = "S" | "A" | "B" | "C";

export interface RankCalculationInput {
  totalExperienceYears?: number;
  desiredAreas?: string[];
  previousHourlyRate?: number;
}

const AREA_BONUS: Record<string, number> = {
  銀座: 2000,
  六本木: 1500,
  新宿: 1000,
  渋谷: 800,
  池袋: 700,
  歌舞伎町: 900,
  上野: 600,
  五反田: 600,
  横浜: 700,
  大阪: 800,
  名古屋: 700,
  福岡: 600,
};

export function calculateBaseRate(input: RankCalculationInput): number {
  const years = input.totalExperienceYears ?? 0;

  let baseRate = 3000;
  if (years >= 5) baseRate = 6000;
  else if (years >= 2) baseRate = 5000;
  else if (years > 0) baseRate = 4000;

  const maxAreaBonus = (input.desiredAreas ?? []).reduce(
    (max, area) => Math.max(max, AREA_BONUS[area] ?? 0),
    0
  );
  baseRate += maxAreaBonus;

  if (input.previousHourlyRate && input.previousHourlyRate > baseRate) {
    baseRate = Math.round((baseRate + input.previousHourlyRate) / 2);
  }

  return baseRate;
}

export function calculateRank(input: RankCalculationInput): CastRank {
  const baseRate = calculateBaseRate(input);

  if (baseRate >= 7000) return "S";
  if (baseRate >= 5500) return "A";
  if (baseRate >= 4000) return "B";
  return "C";
}
