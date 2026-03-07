import { COMPATIBILITY_TYPES, DETAIL_LABELS } from "./result-data";

export interface CompatibilityDetail {
  label: string;
  stars: number;
}

export interface CompatibilityResult {
  percentage: number;
  typeName: string;
  comment: string;
  details: CompatibilityDetail[];
}

function hashFromNames(name1: string, name2: string): number {
  // 名前の順序に依存しないようソートしてから結合
  const sorted = [name1, name2].sort();
  const combined = sorted.join("");

  // 文字コード合算 + 現在時刻（分単位）をシード
  let charSum = 0;
  for (let i = 0; i < combined.length; i++) {
    charSum += combined.charCodeAt(i) * (i + 1);
  }

  const now = new Date();
  const minuteSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const timeFactor = Math.floor(now.getTime() / 60000); // 分単位

  // 簡易ハッシュ
  let hash = charSum * 2654435761 + minuteSeed * 31 + timeFactor * 17;
  hash = Math.abs(hash) >>> 0;
  return hash;
}

export function calculateCompatibility(
  name1: string,
  name2: string
): CompatibilityResult {
  const hash = hashFromNames(name1, name2);

  // 60〜99の範囲に収める
  const percentage = 60 + (hash % 40);

  // タイプ判定
  const typeData =
    COMPATIBILITY_TYPES.find((t) => percentage >= t.minPercentage) ??
    COMPATIBILITY_TYPES[COMPATIBILITY_TYPES.length - 1];

  // 詳細3項目（1〜5星）
  const details: CompatibilityDetail[] = DETAIL_LABELS.map((label, i) => {
    const detailHash = Math.abs((hash >>> (i * 8)) + (hash >>> (i * 4)) * 7) >>> 0;
    const stars = 1 + (detailHash % 5);
    return { label, stars };
  });

  return {
    percentage,
    typeName: typeData.typeName,
    comment: typeData.comment,
    details,
  };
}
