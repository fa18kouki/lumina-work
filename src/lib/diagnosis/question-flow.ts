/**
 * AI診断の質問フロー定義
 */

import type {
  Question,
  DiagnosisStep,
  StepInfo,
  DiagnosisAnswers,
} from "./types";
import { getAllAreas } from "../areas";

// ステップ定義
export const DIAGNOSIS_STEPS: StepInfo[] = [
  { step: "BASIC_INFO", label: "基本情報", questionCount: 4 },
  { step: "CONTACT", label: "連絡先", questionCount: 3 },
  { step: "EXPERIENCE", label: "経験・スキル", questionCount: 7 },
  { step: "PREFERENCES", label: "希望条件", questionCount: 6 },
  { step: "SELF_PR", label: "自己PR", questionCount: 4 },
  { step: "AVAILABILITY", label: "稼働状況", questionCount: 2 },
];

// エリア選択肢（全国エリアデータから自動生成）
const AREA_OPTIONS = getAllAreas().map((area) => ({
  id: area.id,
  label: area.label,
  value: area.label,
}));

// 業種選択肢
const BUSINESS_TYPE_OPTIONS = [
  { id: "cabaret", label: "キャバクラ", value: "CABARET" },
  { id: "club", label: "クラブ", value: "CLUB" },
  { id: "lounge", label: "ラウンジ", value: "LOUNGE" },
  { id: "girls_bar", label: "ガールズバー", value: "GIRLS_BAR" },
  { id: "snack", label: "スナック", value: "SNACK" },
  { id: "other", label: "その他", value: "OTHER" },
];

// お酒の強さ選択肢
const ALCOHOL_OPTIONS = [
  { id: "none", label: "飲めない", value: "NONE" },
  { id: "weak", label: "弱い", value: "WEAK" },
  { id: "moderate", label: "普通", value: "MODERATE" },
  { id: "strong", label: "強い", value: "STRONG" },
];

// 雰囲気選択肢
const ATMOSPHERE_OPTIONS = [
  { id: "calm", label: "落ち着いた店", value: "落ち着いた店" },
  { id: "lively", label: "ワイワイ系", value: "ワイワイ系" },
  { id: "elegant", label: "高級感のある店", value: "高級感のある店" },
  { id: "casual", label: "カジュアルな店", value: "カジュアルな店" },
  { id: "adult", label: "大人な雰囲気", value: "大人な雰囲気" },
];

// 客層選択肢
const CLIENTELE_OPTIONS = [
  { id: "business", label: "ビジネスマン", value: "ビジネスマン" },
  { id: "executive", label: "経営者・役員", value: "経営者・役員" },
  { id: "celebrity", label: "芸能人・著名人", value: "芸能人・著名人" },
  { id: "young", label: "若めの客層", value: "若めの客層" },
  { id: "regular", label: "常連客が多い", value: "常連客が多い" },
];

// 質問定義
export const QUESTIONS: Question[] = [
  // ==================== BASIC_INFO ====================
  {
    id: "nickname",
    step: "BASIC_INFO",
    type: "text",
    content:
      "はじめまして！あなたのプロフィールを作成していきますね。\n\nまずはニックネーム（源氏名）を教えてください",
    placeholder: "例: あい",
    validation: { required: true, maxLength: 50 },
    followUp: "素敵なお名前ですね！",
  },
  {
    id: "age",
    step: "BASIC_INFO",
    type: "select",
    content: "年齢を教えてください",
    options: [
      { id: "18-20", label: "18〜20歳", value: 19 },
      { id: "21-23", label: "21〜23歳", value: 22 },
      { id: "24-26", label: "24〜26歳", value: 25 },
      { id: "27-29", label: "27〜29歳", value: 28 },
      { id: "30-32", label: "30〜32歳", value: 31 },
      { id: "33-35", label: "33〜35歳", value: 34 },
      { id: "36+", label: "36歳以上", value: 36 },
    ],
    validation: { required: true },
    followUp: "ありがとうございます！",
  },
  {
    id: "birthDate",
    step: "BASIC_INFO",
    type: "date",
    content: "生年月日を教えてください（より正確な診断のため）",
    placeholder: "1995-01-15",
    validation: { required: false },
    followUp: "了解しました！",
  },
  {
    id: "photos",
    step: "BASIC_INFO",
    type: "photo",
    content:
      "プロフィール写真をアップロードしてください\n（最大5枚まで。あなたの魅力が伝わる写真をお願いします）",
    validation: { required: false },
    followUp: "素敵な写真ですね！",
  },

  // ==================== CONTACT ====================
  {
    id: "instagramId",
    step: "CONTACT",
    type: "text",
    content:
      "次は連絡先についてお聞きします。\n\nInstagramのアカウントIDを教えてください（任意）",
    placeholder: "例: @your_instagram",
    validation: { required: false },
    followUp: "登録しました！",
  },
  {
    id: "lineId",
    step: "CONTACT",
    type: "text",
    content: "LINE IDを教えてください（任意）\n※店舗との連絡に使用します",
    placeholder: "例: your_line_id",
    validation: { required: false },
    followUp: "ありがとうございます！",
  },
  {
    id: "currentListingUrl",
    step: "CONTACT",
    type: "text",
    content:
      "現在の在籍店の情報サイトURLがあれば教えてください（任意）\n※店舗があなたの経歴を確認するのに役立ちます",
    placeholder: "https://...",
    validation: { required: false },
    followUp: "確認しました！",
  },

  // ==================== EXPERIENCE ====================
  {
    id: "totalExperienceYears",
    step: "EXPERIENCE",
    type: "select",
    content: "経験についてお聞きします。\n\nナイトワークの総経験年数を教えてください",
    options: [
      { id: "0", label: "未経験", value: 0 },
      { id: "1", label: "1年未満", value: 0.5 },
      { id: "1-2", label: "1〜2年", value: 1.5 },
      { id: "3-5", label: "3〜5年", value: 4 },
      { id: "6-10", label: "6〜10年", value: 8 },
      { id: "10+", label: "10年以上", value: 12 },
    ],
    validation: { required: true },
    followUp: "なるほど！",
  },
  {
    id: "experienceAreas",
    step: "EXPERIENCE",
    type: "multiselect",
    content: "これまで働いたことのあるエリアを教えてください（複数選択可）",
    options: AREA_OPTIONS,
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.totalExperienceYears === 0,
    followUp: "いろいろな場所で経験されているんですね！",
  },
  {
    id: "experienceBusinessTypes",
    step: "EXPERIENCE",
    type: "multiselect",
    content: "経験した業種を教えてください（複数選択可）",
    options: BUSINESS_TYPE_OPTIONS,
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.totalExperienceYears === 0,
    followUp: "幅広い経験をお持ちですね！",
  },
  {
    id: "previousHourlyRate",
    step: "EXPERIENCE",
    type: "select",
    content: "これまでの最高時給を教えてください",
    options: [
      { id: "3000", label: "3,000円以下", value: 3000 },
      { id: "4000", label: "3,000〜4,000円", value: 4000 },
      { id: "5000", label: "4,000〜5,000円", value: 5000 },
      { id: "6000", label: "5,000〜6,000円", value: 6000 },
      { id: "7000", label: "6,000〜7,000円", value: 7000 },
      { id: "8000", label: "7,000〜8,000円", value: 8000 },
      { id: "10000", label: "8,000〜10,000円", value: 10000 },
      { id: "10000+", label: "10,000円以上", value: 12000 },
    ],
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.totalExperienceYears === 0,
    followUp: "素晴らしい実績ですね！",
  },
  {
    id: "monthlySales",
    step: "EXPERIENCE",
    type: "select",
    content: "月間売上の実績を教えてください（任意）",
    options: [
      { id: "100", label: "100万円以下", value: 100 },
      { id: "200", label: "100〜200万円", value: 200 },
      { id: "300", label: "200〜300万円", value: 300 },
      { id: "500", label: "300〜500万円", value: 500 },
      { id: "1000", label: "500〜1000万円", value: 1000 },
      { id: "1000+", label: "1000万円以上", value: 1500 },
    ],
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.totalExperienceYears === 0,
    followUp: "立派な実績ですね！",
  },
  {
    id: "monthlyNominations",
    step: "EXPERIENCE",
    type: "select",
    content: "月間の指名本数を教えてください（任意）",
    options: [
      { id: "10", label: "10本以下", value: 10 },
      { id: "20", label: "10〜20本", value: 20 },
      { id: "30", label: "20〜30本", value: 30 },
      { id: "50", label: "30〜50本", value: 50 },
      { id: "100", label: "50〜100本", value: 100 },
      { id: "100+", label: "100本以上", value: 150 },
    ],
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.totalExperienceYears === 0,
    followUp: "人気があるんですね！",
  },
  {
    id: "alcoholTolerance",
    step: "EXPERIENCE",
    type: "select",
    content: "お酒の強さを教えてください",
    options: ALCOHOL_OPTIONS,
    validation: { required: false },
    followUp: "了解しました！",
  },

  // ==================== PREFERENCES ====================
  {
    id: "desiredAreas",
    step: "PREFERENCES",
    type: "multiselect",
    content: "希望の勤務エリアを教えてください（複数選択可）",
    options: AREA_OPTIONS,
    validation: { required: true },
    followUp: "いい選択ですね！",
  },
  {
    id: "desiredHourlyRate",
    step: "PREFERENCES",
    type: "select",
    content: "希望の時給を教えてください",
    options: [
      { id: "3000", label: "3,000円以上", value: 3000 },
      { id: "4000", label: "4,000円以上", value: 4000 },
      { id: "5000", label: "5,000円以上", value: 5000 },
      { id: "6000", label: "6,000円以上", value: 6000 },
      { id: "7000", label: "7,000円以上", value: 7000 },
      { id: "8000", label: "8,000円以上", value: 8000 },
      { id: "10000", label: "10,000円以上", value: 10000 },
    ],
    validation: { required: true },
    followUp: "希望をお聞きしました！",
  },
  {
    id: "desiredMonthlyIncome",
    step: "PREFERENCES",
    type: "select",
    content: "希望の月収を教えてください",
    options: [
      { id: "30", label: "30万円以上", value: 30 },
      { id: "50", label: "50万円以上", value: 50 },
      { id: "70", label: "70万円以上", value: 70 },
      { id: "100", label: "100万円以上", value: 100 },
      { id: "150", label: "150万円以上", value: 150 },
      { id: "200", label: "200万円以上", value: 200 },
    ],
    validation: { required: false },
    followUp: "目標を把握しました！",
  },
  {
    id: "availableDaysPerWeek",
    step: "PREFERENCES",
    type: "select",
    content: "週に何日くらい出勤できますか？",
    options: [
      { id: "1-2", label: "1〜2日", value: 1.5 },
      { id: "3", label: "3日", value: 3 },
      { id: "4", label: "4日", value: 4 },
      { id: "5", label: "5日", value: 5 },
      { id: "6+", label: "6日以上", value: 6 },
    ],
    validation: { required: false },
    followUp: "了解しました！",
  },
  {
    id: "preferredAtmosphere",
    step: "PREFERENCES",
    type: "multiselect",
    content: "希望のお店の雰囲気を教えてください（複数選択可）",
    options: ATMOSPHERE_OPTIONS,
    validation: { required: false },
    followUp: "あなたに合ったお店を探しますね！",
  },
  {
    id: "preferredClientele",
    step: "PREFERENCES",
    type: "multiselect",
    content: "希望の客層を教えてください（複数選択可）",
    options: CLIENTELE_OPTIONS,
    validation: { required: false },
    followUp: "参考になります！",
  },

  // ==================== SELF_PR ====================
  {
    id: "birthdaySales",
    step: "SELF_PR",
    type: "select",
    content:
      "自己PRについてお聞きします。\n\nバースデーイベント（生誕）の売上実績はありますか？",
    options: [
      { id: "none", label: "実績なし", value: 0 },
      { id: "100", label: "100万円以下", value: 100 },
      { id: "200", label: "100〜200万円", value: 200 },
      { id: "300", label: "200〜300万円", value: 300 },
      { id: "500", label: "300〜500万円", value: 500 },
      { id: "1000", label: "500万〜1000万円", value: 1000 },
      { id: "1000+", label: "1000万円以上", value: 1500 },
    ],
    validation: { required: false },
    followUp: "すごいですね！",
  },
  {
    id: "hasVipClients",
    step: "SELF_PR",
    type: "boolean",
    content:
      "太客（経営者・芸能人など）のお客様はいますか？\n※高ランク認定の参考になります",
    options: [
      { id: "yes", label: "はい", value: true },
      { id: "no", label: "いいえ", value: false },
    ],
    validation: { required: false },
    followUp: "ありがとうございます！",
  },
  {
    id: "vipClientDescription",
    step: "SELF_PR",
    type: "text",
    content:
      "差し支えなければ、太客の情報を教えてください（任意）\n※業種や役職など、個人が特定されない範囲で",
    placeholder: "例: IT企業の経営者、医師など",
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) => !answers.hasVipClients,
    followUp: "参考になります！",
  },
  {
    id: "socialFollowers",
    step: "SELF_PR",
    type: "select",
    content: "SNS（Instagram等）のフォロワー数を教えてください",
    options: [
      { id: "1000", label: "1,000人以下", value: 500 },
      { id: "5000", label: "1,000〜5,000人", value: 3000 },
      { id: "10000", label: "5,000〜1万人", value: 7500 },
      { id: "50000", label: "1万〜5万人", value: 30000 },
      { id: "100000", label: "5万〜10万人", value: 75000 },
      { id: "100000+", label: "10万人以上", value: 150000 },
    ],
    validation: { required: false },
    followUp: "SNSでも活躍されているんですね！",
  },

  // ==================== AVAILABILITY ====================
  {
    id: "isAvailableNow",
    step: "AVAILABILITY",
    type: "boolean",
    content: "最後に稼働状況についてお聞きします。\n\n今すぐ働き始めることはできますか？",
    options: [
      { id: "yes", label: "はい、すぐに働けます", value: true },
      { id: "no", label: "少し先になります", value: false },
    ],
    validation: { required: true },
    followUp: "了解しました！",
  },
  {
    id: "downtimeUntil",
    step: "AVAILABILITY",
    type: "date",
    content: "いつ頃から働けそうですか？\n（整形のダウンタイムなどがあれば考慮します）",
    placeholder: "2024-03-01",
    validation: { required: false },
    skipCondition: (answers: DiagnosisAnswers) =>
      answers.isAvailableNow === true,
    followUp: "お待ちしています！",
  },
];

// ヘルパー関数

/**
 * ステップに属する質問を取得
 */
export function getQuestionsForStep(step: DiagnosisStep): Question[] {
  return QUESTIONS.filter((q) => q.step === step);
}

/**
 * 質問をIDで取得
 */
export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/**
 * 次の質問を取得（スキップ条件を考慮）
 */
export function getNextQuestion(
  currentQuestionId: string | null,
  answers: DiagnosisAnswers
): Question | null {
  const currentIndex = currentQuestionId
    ? QUESTIONS.findIndex((q) => q.id === currentQuestionId)
    : -1;

  for (let i = currentIndex + 1; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i];
    if (question.skipCondition && question.skipCondition(answers)) {
      continue;
    }
    return question;
  }

  return null;
}

/**
 * 次の未回答質問を取得（スキップ条件 + 回答済みスキップ）
 * 公開診断データ引き継ぎ時に、既に回答済みの質問をスキップするために使用。
 */
export function getNextUnansweredQuestion(
  currentQuestionId: string | null,
  answers: DiagnosisAnswers
): Question | null {
  const currentIndex = currentQuestionId
    ? QUESTIONS.findIndex((q) => q.id === currentQuestionId)
    : -1;

  for (let i = currentIndex + 1; i < QUESTIONS.length; i++) {
    const question = QUESTIONS[i];
    if (question.skipCondition && question.skipCondition(answers)) {
      continue;
    }
    const existingAnswer = answers[question.id as keyof DiagnosisAnswers];
    if (existingAnswer !== undefined && existingAnswer !== null) {
      continue;
    }
    return question;
  }

  return null;
}

/**
 * 必須質問がすべて回答されているかチェック
 */
export function areRequiredQuestionsAnswered(
  answers: DiagnosisAnswers
): boolean {
  const requiredQuestions = QUESTIONS.filter(
    (q) => q.validation?.required === true
  );

  return requiredQuestions.every((q) => {
    if (q.skipCondition && q.skipCondition(answers)) {
      return true;
    }
    const value = answers[q.id as keyof DiagnosisAnswers];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== "";
  });
}

/**
 * 進捗を計算
 */
export function calculateProgress(answers: DiagnosisAnswers): {
  current: number;
  total: number;
  percentage: number;
} {
  const answeredCount = QUESTIONS.filter((q) => {
    if (q.skipCondition && q.skipCondition(answers)) {
      return true; // スキップされた質問は回答済みとしてカウント
    }
    const value = answers[q.id as keyof DiagnosisAnswers];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== "";
  }).length;

  const total = QUESTIONS.filter((q) => {
    if (q.skipCondition && q.skipCondition(answers)) {
      return false; // スキップされる質問は総数から除外
    }
    return true;
  }).length;

  return {
    current: answeredCount,
    total,
    percentage: total > 0 ? Math.round((answeredCount / total) * 100) : 0,
  };
}

/**
 * 完了メッセージを生成
 */
export function getCompletionMessage(answers: DiagnosisAnswers): string {
  const nickname = answers.nickname || "あなた";
  return `${nickname}さん、診断が完了しました！\n\nあなたにぴったりのお店を見つけるお手伝いをします。\n\n「店舗を探す」ボタンから、あなたに合った店舗を見てみましょう！`;
}
