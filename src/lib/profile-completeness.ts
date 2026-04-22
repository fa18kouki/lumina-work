/**
 * キャストプロフィール完了度計算
 */

export interface CastProfileData {
  // カテゴリ1: 基本情報・連絡先
  fullName: string | null;
  furigana: string | null;
  gender: string | null;
  currentArea: string | null;
  permanentAddress: string | null;
  phoneNumber: string | null;
  bloodType: string | null;
  zodiacSign: string | null;
  email: string | null;
  pcEmail: string | null;
  instagramId: string | null;
  lineId: string | null;
  facebookId: string | null;
  twitterId: string | null;
  tiktokId: string | null;
  hobbies: string | null;
  specialSkills: string | null;
  emergencyContact: unknown;

  // カテゴリ2: 属性
  livingArrangement: string | null;
  transportation: string | null;
  needsPickup: boolean | null;
  hasTattoo: boolean | null;
  dressAvailability: string | null;
  hasBoyfriend: boolean | null;
  hasHusband: boolean | null;
  hasChildren: boolean | null;

  // カテゴリ3: キャリア・身体情報
  currentOccupation: string | null;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
  cupSize: string | null;
  languageSkills: unknown;
  cosmeticSurgery: string | null;

  // カテゴリ4: 業務アンケート
  birthdayEventWillingness: boolean | null;
  photoPublicationConsent: boolean | null;
  familyApproval: boolean | null;

  // カテゴリ5: 希望条件
  desiredAreas: string[];
  desiredHourlyRate: number | null;
  desiredMonthlyIncome: number | null;
  availableDaysPerWeek: number | null;
  shiftPreferences: unknown;
  motivation: string | null;
  storePreferences: string | null;
  guaranteedHourlyRate: number | null;

  // カテゴリ6: 職歴
  workHistories: Array<{ storeName: string }>;
}

interface CategoryResult {
  id: number;
  label: string;
  percent: number;
  filledCount: number;
  totalCount: number;
}

export interface ProfileCompleteness {
  totalPercent: number;
  categories: CategoryResult[];
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return true;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

type CategoryDef = {
  id: number;
  label: string;
  weight: number;
  fields: (keyof CastProfileData)[];
  isSpecial?: boolean;
};

const CATEGORIES: CategoryDef[] = [
  {
    id: 1,
    label: "基本情報・連絡先",
    weight: 25,
    fields: [
      "fullName", "furigana", "gender", "currentArea", "permanentAddress",
      "phoneNumber", "bloodType", "zodiacSign", "email", "pcEmail",
      "instagramId", "lineId", "facebookId", "twitterId", "tiktokId",
      "hobbies", "specialSkills", "emergencyContact",
    ],
  },
  {
    id: 2,
    label: "属性・ライフスタイル",
    weight: 10,
    fields: [
      "livingArrangement", "transportation", "needsPickup", "hasTattoo",
      "dressAvailability", "hasBoyfriend", "hasHusband", "hasChildren",
    ],
  },
  {
    id: 3,
    label: "キャリア・身体情報",
    weight: 20,
    fields: [
      "currentOccupation", "height", "weight", "bust", "waist", "hip",
      "cupSize", "languageSkills", "cosmeticSurgery",
    ],
  },
  {
    id: 4,
    label: "業務アンケート",
    weight: 10,
    fields: [
      "birthdayEventWillingness", "photoPublicationConsent", "familyApproval",
    ],
  },
  {
    id: 5,
    label: "希望条件",
    weight: 20,
    fields: [
      "desiredAreas", "desiredHourlyRate", "desiredMonthlyIncome",
      "availableDaysPerWeek", "shiftPreferences", "motivation",
      "storePreferences", "guaranteedHourlyRate",
    ],
  },
  {
    id: 6,
    label: "職歴",
    weight: 15,
    fields: ["workHistories"],
    isSpecial: true,
  },
];

export function calculateProfileCompleteness(
  cast: CastProfileData
): ProfileCompleteness {
  const categoryResults: CategoryResult[] = CATEGORIES.map((cat) => {
    if (cat.isSpecial && cat.id === 6) {
      const hasHistory = cast.workHistories && cast.workHistories.length > 0;
      return {
        id: cat.id,
        label: cat.label,
        percent: hasHistory ? 100 : 0,
        filledCount: hasHistory ? 1 : 0,
        totalCount: 1,
      };
    }

    const totalCount = cat.fields.length;
    let filledCount = 0;
    for (const field of cat.fields) {
      if (isFilled(cast[field])) {
        filledCount++;
      }
    }

    return {
      id: cat.id,
      label: cat.label,
      percent: totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0,
      filledCount,
      totalCount,
    };
  });

  const totalPercent = Math.round(
    categoryResults.reduce((sum, cat) => {
      const catDef = CATEGORIES.find((c) => c.id === cat.id)!;
      return sum + (cat.percent / 100) * catDef.weight;
    }, 0)
  );

  return {
    totalPercent,
    categories: categoryResults,
  };
}

type CastLike = Partial<Record<keyof CastProfileData, unknown>>;

export interface DerivePercentInput {
  cast: CastLike;
  workHistories: Array<{ storeName: string }>;
}

/**
 * Prisma の Cast upsert 入力などから充実度 0-100 の整数値を導出する。
 * 内部的に `calculateProfileCompleteness` を呼び、`totalPercent` のみを返す。
 * DB への永続化値として使う用途を想定しており、カテゴリ詳細は不要。
 */
export function deriveProfileCompletenessPercent(
  input: DerivePercentInput,
): number {
  const castData = normalizeCastInput(input.cast);
  const profile: CastProfileData = {
    ...castData,
    workHistories: input.workHistories,
  };
  return calculateProfileCompleteness(profile).totalPercent;
}

function normalizeCastInput(cast: CastLike): Omit<CastProfileData, "workHistories"> {
  const get = <K extends keyof CastProfileData>(key: K): CastProfileData[K] => {
    const value = cast[key];
    return (value === undefined ? null : value) as CastProfileData[K];
  };

  return {
    fullName: get("fullName"),
    furigana: get("furigana"),
    gender: get("gender"),
    currentArea: get("currentArea"),
    permanentAddress: get("permanentAddress"),
    phoneNumber: get("phoneNumber"),
    bloodType: get("bloodType"),
    zodiacSign: get("zodiacSign"),
    email: get("email"),
    pcEmail: get("pcEmail"),
    instagramId: get("instagramId"),
    lineId: get("lineId"),
    facebookId: get("facebookId"),
    twitterId: get("twitterId"),
    tiktokId: get("tiktokId"),
    hobbies: get("hobbies"),
    specialSkills: get("specialSkills"),
    emergencyContact: cast.emergencyContact ?? null,
    livingArrangement: get("livingArrangement"),
    transportation: get("transportation"),
    needsPickup: get("needsPickup"),
    hasTattoo: get("hasTattoo"),
    dressAvailability: get("dressAvailability"),
    hasBoyfriend: get("hasBoyfriend"),
    hasHusband: get("hasHusband"),
    hasChildren: get("hasChildren"),
    currentOccupation: get("currentOccupation"),
    height: get("height"),
    weight: get("weight"),
    bust: get("bust"),
    waist: get("waist"),
    hip: get("hip"),
    cupSize: get("cupSize"),
    languageSkills: cast.languageSkills ?? null,
    cosmeticSurgery: get("cosmeticSurgery"),
    birthdayEventWillingness: get("birthdayEventWillingness"),
    photoPublicationConsent: get("photoPublicationConsent"),
    familyApproval: get("familyApproval"),
    desiredAreas: (cast.desiredAreas as string[] | undefined) ?? [],
    desiredHourlyRate: get("desiredHourlyRate"),
    desiredMonthlyIncome: get("desiredMonthlyIncome"),
    availableDaysPerWeek: get("availableDaysPerWeek"),
    shiftPreferences: cast.shiftPreferences ?? null,
    motivation: get("motivation"),
    storePreferences: get("storePreferences"),
    guaranteedHourlyRate: get("guaranteedHourlyRate"),
  };
}
