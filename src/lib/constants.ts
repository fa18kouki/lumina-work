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
