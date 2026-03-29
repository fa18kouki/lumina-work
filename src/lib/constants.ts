/** システム共通エリアリスト（全ページで使用） */
export { AREAS, type Area } from "./areas";

/** 業種リスト */
export const BUSINESS_TYPES = [
  { value: "CABARET", label: "キャバクラ" },
  { value: "CLUB", label: "クラブ" },
  { value: "LOUNGE", label: "ラウンジ" },
  { value: "GIRLS_BAR", label: "ガールズバー" },
  { value: "SNACK", label: "スナック" },
  { value: "OTHER", label: "その他" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

/** サブスクリプションプラン定義 */
export const SUBSCRIPTION_PLANS = [
  {
    id: "CASUAL" as const,
    name: "カジュアル",
    tier: "casual" as const,
    pricePerStore: 50000,
    priceLabel: "¥50,000",
    offerLimit: 10 as number | null,
    description: "機能を制限して手軽に始めたい店舗向け",
    features: [
      "月10件までオファー送信",
      "キャスト検索",
      "メッセージ機能",
      "面接管理機能",
    ],
  },
  {
    id: "PRO_TRIAL" as const,
    name: "プロ",
    tier: "pro" as const,
    pricePerStore: 90000,
    priceLabel: "¥90,000",
    offerLimit: null as number | null,
    storeRange: "1〜4店舗",
    description: "1〜4店舗を運営する企業向け",
    features: [
      "オファー送信無制限",
      "全キャスト検索・フィルター",
      "メッセージ機能",
      "面接管理機能",
      "優先サポート",
    ],
    recommended: true,
  },
  {
    id: "PRO_BUSINESS" as const,
    name: "プロ ビジネス",
    tier: "pro" as const,
    pricePerStore: 80000,
    priceLabel: "¥80,000",
    offerLimit: null as number | null,
    storeRange: "5〜19店舗",
    discount: "10%OFF",
    description: "5〜19店舗のグループ向け",
    features: [
      "オファー送信無制限",
      "全キャスト検索・フィルター",
      "メッセージ機能",
      "面接管理機能",
      "優先サポート",
    ],
  },
  {
    id: "PRO_ENTERPRISE" as const,
    name: "プロ エンタープライズ",
    tier: "pro" as const,
    pricePerStore: 65000,
    priceLabel: "¥65,000",
    offerLimit: null as number | null,
    storeRange: "20店舗以上",
    discount: "25%OFF",
    description: "20店舗以上の大規模グループ向け",
    features: [
      "オファー送信無制限",
      "全キャスト検索・フィルター",
      "メッセージ機能",
      "面接管理機能",
      "優先サポート",
    ],
  },
] as const;

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];

/** プランに応じたオファー上限を返す（null = 無制限） */
export function getOfferLimitForPlan(plan: SubscriptionPlanId): number | null {
  if (plan === "CASUAL") return 10;
  return null;
}

/** プロ版かどうか判定 */
export function isProPlan(plan: SubscriptionPlanId): boolean {
  return plan !== "CASUAL";
}

/** 血液型 */
export const BLOOD_TYPES = [
  { value: "A", label: "A型" },
  { value: "B", label: "B型" },
  { value: "O", label: "O型" },
  { value: "AB", label: "AB型" },
] as const;

/** 干支 */
export const ZODIAC_SIGNS = [
  { value: "rat", label: "子（ねずみ）" },
  { value: "ox", label: "丑（うし）" },
  { value: "tiger", label: "寅（とら）" },
  { value: "rabbit", label: "卯（うさぎ）" },
  { value: "dragon", label: "辰（たつ）" },
  { value: "snake", label: "巳（へび）" },
  { value: "horse", label: "午（うま）" },
  { value: "sheep", label: "未（ひつじ）" },
  { value: "monkey", label: "申（さる）" },
  { value: "rooster", label: "酉（とり）" },
  { value: "dog", label: "戌（いぬ）" },
  { value: "boar", label: "亥（いのしし）" },
] as const;

/** カップサイズ */
export const CUP_SIZES = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" },
  { value: "H", label: "H以上" },
] as const;

/** 性別 */
export const GENDER_OPTIONS = [
  { value: "female", label: "女性" },
  { value: "male", label: "男性" },
  { value: "other", label: "その他" },
] as const;

/** 居住形態 */
export const LIVING_OPTIONS = [
  { value: "WITH_FAMILY", label: "実家" },
  { value: "ALONE", label: "独り暮らし" },
  { value: "OTHER", label: "その他" },
] as const;

/** 交通手段 */
export const TRANSPORT_OPTIONS = [
  { value: "CAR", label: "車" },
  { value: "TRAIN", label: "電車" },
  { value: "OTHER", label: "その他" },
] as const;

/** ドレス */
export const DRESS_OPTIONS = [
  { value: "OWNED", label: "有（自前）" },
  { value: "RENTAL", label: "レンタル希望" },
] as const;

/** 在籍状況 */
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "INTERVIEW_ONLY", label: "面接のみ" },
  { value: "TRIAL", label: "体験（1体）" },
  { value: "EMPLOYED", label: "在籍" },
  { value: "RESIGNED", label: "退職" },
] as const;

/** お酒の強さ */
export const ALCOHOL_OPTIONS = [
  { value: "NONE", label: "飲めない" },
  { value: "WEAK", label: "弱い" },
  { value: "MODERATE", label: "普通" },
  { value: "STRONG", label: "強い" },
  { value: "NG", label: "完全NG" },
] as const;
