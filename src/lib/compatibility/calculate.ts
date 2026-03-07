import {
  COMPATIBILITY_TYPES,
  DETAIL_LABELS,
  LOVE_TYPES,
  LUCKY_COLORS,
  LUCKY_DATE_SPOTS,
  ADVICE_LIST,
  ZODIAC_ELEMENTS,
  ELEMENT_COMPATIBILITY,
  BLOOD_TYPE_COMPATIBILITY,
} from "./result-data";

export type BloodType = "A" | "B" | "O" | "AB";

export interface CompatibilityInput {
  name1: string;
  month1: number;
  day1: number;
  bloodType1: BloodType;
  name2: string;
  month2: number;
  day2: number;
  bloodType2: BloodType;
}

export interface CompatibilityDetail {
  label: string;
  stars: number;
}

export interface LoveTypeInfo {
  name: string;
  description: string;
}

export interface CompatibilityResult {
  percentage: number;
  typeName: string;
  comment: string;
  details: CompatibilityDetail[];
  loveType1: LoveTypeInfo;
  loveType2: LoveTypeInfo;
  lucky: {
    color: string;
    dateSpot: string;
  };
  advice: string;
}

// 星座の境界日（月ごとの切り替え日）
const ZODIAC_BOUNDARIES: [number, string][] = [
  // [切り替え日, 切り替え後の星座]
  // 1月
  [120, "みずがめ座"], // 1/20〜
  [220, "うお座"],     // 2/20〜
  [321, "おひつじ座"], // 3/21〜
  [420, "おうし座"],   // 4/20〜
  [521, "ふたご座"],   // 5/21〜
  [622, "かに座"],     // 6/22〜
  [723, "しし座"],     // 7/23〜
  [823, "おとめ座"],   // 8/23〜
  [923, "てんびん座"], // 9/23〜
  [1024, "さそり座"],  // 10/24〜
  [1123, "いて座"],    // 11/23〜
  [1222, "やぎ座"],    // 12/22〜
];

export function getZodiacSign(month: number, day: number): string {
  const key = month * 100 + day;
  // 逆順で最初にマッチする境界を探す
  for (let i = ZODIAC_BOUNDARIES.length - 1; i >= 0; i--) {
    if (key >= ZODIAC_BOUNDARIES[i][0]) {
      return ZODIAC_BOUNDARIES[i][1];
    }
  }
  // 1/1〜1/19 → やぎ座
  return "やぎ座";
}

export function getLifePathNumber(month: number, day: number): number {
  let sum = month + day;
  while (sum > 22) {
    sum = digitSum(sum);
  }
  // マスターナンバー 11, 22 はそのまま
  if (sum === 11 || sum === 22) return sum;
  while (sum > 9) {
    sum = digitSum(sum);
  }
  return sum;
}

function digitSum(n: number): number {
  let s = 0;
  while (n > 0) {
    s += n % 10;
    n = Math.floor(n / 10);
  }
  return s;
}

function hashFromNames(name1: string, name2: string): number {
  const sorted = [name1, name2].sort();
  const combined = sorted.join("");
  let charSum = 0;
  for (let i = 0; i < combined.length; i++) {
    charSum += combined.charCodeAt(i) * (i + 1);
  }
  return Math.abs(charSum * 2654435761) >>> 0;
}

function todayBonus(name1: string, name2: string): number {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const sorted = [name1, name2].sort();
  let h = daySeed;
  for (const c of sorted.join("")) {
    h = ((h << 5) - h + c.charCodeAt(0)) >>> 0;
  }
  // -5 〜 +5
  return (h % 11) - 5;
}

/**
 * 入力をソートして順序非依存にする
 */
function normalizeInput(input: CompatibilityInput): {
  p1: { name: string; month: number; day: number; bloodType: BloodType };
  p2: { name: string; month: number; day: number; bloodType: BloodType };
} {
  const a = { name: input.name1, month: input.month1, day: input.day1, bloodType: input.bloodType1 };
  const b = { name: input.name2, month: input.month2, day: input.day2, bloodType: input.bloodType2 };
  if (a.name <= b.name) return { p1: a, p2: b };
  return { p1: b, p2: a };
}

export function calculateCompatibility(
  input: CompatibilityInput
): CompatibilityResult {
  const { p1, p2 } = normalizeInput(input);

  // 1. 星座相性
  const zodiac1 = getZodiacSign(p1.month, p1.day);
  const zodiac2 = getZodiacSign(p2.month, p2.day);
  const elem1 = ZODIAC_ELEMENTS[zodiac1];
  const elem2 = ZODIAC_ELEMENTS[zodiac2];
  const zodiacScore = ELEMENT_COMPATIBILITY[elem1][elem2]; // 0-10

  // 2. 血液型相性
  const bloodScore = BLOOD_TYPE_COMPATIBILITY[p1.bloodType][p2.bloodType]; // 0-10

  // 3. 数秘術相性
  const life1 = getLifePathNumber(p1.month, p1.day);
  const life2 = getLifePathNumber(p2.month, p2.day);
  const numerologyScore = getNumerologyScore(life1, life2); // 0-10

  // 4. 名前の画数相性
  const nameHash = hashFromNames(p1.name, p2.name);
  const nameScore = 4 + (nameHash % 7); // 4-10

  // 5. 今日の運勢ボーナス
  const bonus = todayBonus(p1.name, p2.name); // -5〜+5

  // 重み付け平均（星座30%, 血液型20%, 数秘術25%, 名前15%, ボーナス10%）
  const rawScore =
    zodiacScore * 0.3 +
    bloodScore * 0.2 +
    numerologyScore * 0.25 +
    nameScore * 0.15 +
    ((bonus + 5) / 10) * 10 * 0.1;

  // 0-10 → 60-99 にマッピング
  const percentage = Math.min(99, Math.max(60, Math.round(60 + (rawScore / 10) * 39)));

  // タイプ判定
  const typeData =
    COMPATIBILITY_TYPES.find((t) => percentage >= t.minPercentage) ??
    COMPATIBILITY_TYPES[COMPATIBILITY_TYPES.length - 1];

  // 詳細5項目
  const details: CompatibilityDetail[] = DETAIL_LABELS.map((label, i) => {
    const detailSeed = Math.abs(
      (nameHash >>> (i * 5)) + zodiacScore * (i + 3) + bloodScore * (i + 7) + numerologyScore * (i + 2)
    ) >>> 0;
    const stars = 1 + (detailSeed % 5);
    return { label, stars };
  });

  // 恋愛タイプ判定（星座+数秘術ベース）
  const loveType1 = getLoveType(p1.month, p1.day, life1);
  const loveType2 = getLoveType(p2.month, p2.day, life2);

  // ラッキー情報
  const luckySeed = (nameHash + zodiacScore * 17 + bloodScore * 31) >>> 0;
  const lucky = {
    color: LUCKY_COLORS[luckySeed % LUCKY_COLORS.length],
    dateSpot: LUCKY_DATE_SPOTS[(luckySeed >>> 8) % LUCKY_DATE_SPOTS.length],
  };

  // アドバイス
  const adviceSeed = (nameHash + numerologyScore * 13 + life1 * 7 + life2 * 11) >>> 0;
  const advice = ADVICE_LIST[adviceSeed % ADVICE_LIST.length];

  return {
    percentage,
    typeName: typeData.typeName,
    comment: typeData.comment,
    details,
    loveType1,
    loveType2,
    lucky,
    advice,
  };
}

function getNumerologyScore(life1: number, life2: number): number {
  const diff = Math.abs(normalizeLifePath(life1) - normalizeLifePath(life2));
  // 同じ数 → 高相性、差が大きい → 低相性（ただし補完の関係もある）
  if (diff === 0) return 9;
  if (diff <= 1) return 8;
  if (diff <= 2) return 7;
  if (diff <= 3) return 6;
  if (diff === 4) return 7; // 補完の関係
  return 5;
}

function normalizeLifePath(n: number): number {
  if (n === 11) return 2;
  if (n === 22) return 4;
  return n;
}

function getLoveType(month: number, day: number, lifePath: number): LoveTypeInfo {
  const zodiac = getZodiacSign(month, day);
  const elem = ZODIAC_ELEMENTS[zodiac];

  // エレメント(0-3) × 3 + ライフパス系(0-2) → 0-11
  const elemIndex =
    elem === "fire" ? 0 : elem === "earth" ? 1 : elem === "air" ? 2 : 3;
  const lifeGroup = normalizeLifePath(lifePath) % 3;
  const typeIndex = (elemIndex * 3 + lifeGroup) % LOVE_TYPES.length;

  return LOVE_TYPES[typeIndex];
}
