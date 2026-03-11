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
    id: "FREE" as const,
    name: "フリー",
    price: 0,
    priceLabel: "¥0",
    description: "まずはお試しで始めたい店舗向け",
    features: [
      "月5件までオファー送信",
      "基本的なキャスト検索",
      "メッセージ機能",
    ],
  },
  {
    id: "BASIC" as const,
    name: "ベーシック",
    price: 99999,
    priceLabel: "¥99,999",
    description: "本格的に採用活動を行う店舗向け",
    features: [
      "月30件までオファー送信",
      "詳細なキャスト検索・フィルター",
      "メッセージ機能",
      "面接管理機能",
      "応募者分析レポート",
    ],
  },
  {
    id: "PREMIUM" as const,
    name: "プレミアム",
    price: 99999,
    priceLabel: "¥99,999",
    description: "大量採用・複数店舗を運営する企業向け",
    features: [
      "オファー送信無制限",
      "AI 検索優先表示",
      "詳細なキャスト検索・フィルター",
      "メッセージ機能",
      "面接管理機能",
      "応募者分析レポート",
      "優先サポート",
      "複数店舗管理",
    ],
    recommended: true,
  },
] as const;

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]["id"];

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
