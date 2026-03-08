"use client";

// 診断セッションの型定義
export type DiagnosisStep =
  | "START"
  | "BASIC"
  | "INTERVIEW"
  | "RESULT"
  | "OFFERS";

export type CastRank = "S" | "A" | "B" | "C";

export interface DiagnosisAnswers {
  // 基本情報
  age?: number;

  // 経験・スキル（Cast.totalExperienceYears 等に対応）
  totalExperienceYears?: number;
  previousHourlyRate?: number;
  alcoholTolerance?: string;

  // 希望条件（Cast.desiredAreas 等に対応）
  desiredAreas?: string[];
  desiredHourlyRate?: number;
  availableDaysPerWeek?: number;
  preferredAtmosphere?: string[];

  // 強み・特徴
  strengths?: string[];

  // 顔写真URL
  photos?: string[];
}

export interface DiagnosisResult {
  estimatedRank: CastRank;
  estimatedHourlyRate: number;
  estimatedMonthlyIncome: number;
  matchingStoreIds: string[];
  analysis: {
    strengths: string[];
    improvements: string[];
    recommendation: string;
  };
}

export interface DiagnosisSession {
  id: string;
  step: DiagnosisStep;
  answers: DiagnosisAnswers;
  result?: DiagnosisResult;
  createdAt: string;
  expiresAt: string;
}

const STORAGE_KEY = "diagnosis_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24時間

// ランダムID生成
function generateId(): string {
  return `diag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 新規セッション作成
export function createDiagnosisSession(): DiagnosisSession {
  const now = new Date();
  const session: DiagnosisSession = {
    id: generateId(),
    step: "START",
    answers: {},
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

// セッション取得
export function getDiagnosisSession(): DiagnosisSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const session: DiagnosisSession = JSON.parse(stored);

    // 有効期限チェック
    if (new Date(session.expiresAt) < new Date()) {
      clearDiagnosisSession();
      return null;
    }

    return session;
  } catch {
    clearDiagnosisSession();
    return null;
  }
}

// セッション更新
export function updateDiagnosisSession(
  updates: Partial<Omit<DiagnosisSession, "id" | "createdAt" | "expiresAt">>
): DiagnosisSession | null {
  const session = getDiagnosisSession();
  if (!session) {
    return null;
  }

  const updatedSession: DiagnosisSession = {
    ...session,
    ...updates,
    answers: {
      ...session.answers,
      ...(updates.answers || {}),
    },
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
  }

  return updatedSession;
}

// ステップ更新
export function updateDiagnosisStep(step: DiagnosisStep): DiagnosisSession | null {
  return updateDiagnosisSession({ step });
}

// 回答追加
export function addDiagnosisAnswers(
  answers: Partial<DiagnosisAnswers>
): DiagnosisSession | null {
  const session = getDiagnosisSession();
  if (!session) {
    return null;
  }

  return updateDiagnosisSession({
    answers: { ...session.answers, ...answers },
  });
}

// 結果設定
export function setDiagnosisResult(
  result: DiagnosisResult
): DiagnosisSession | null {
  return updateDiagnosisSession({ result, step: "RESULT" });
}

// セッション削除
export function clearDiagnosisSession(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

// セッションが存在するか確認
export function hasDiagnosisSession(): boolean {
  return getDiagnosisSession() !== null;
}

// 診断結果を計算
export function calculateDiagnosisResult(
  answers: DiagnosisAnswers
): DiagnosisResult {
  const years = answers.totalExperienceYears ?? 0;

  // 経験年数によるベース時給
  let baseRate = 3000;
  if (years >= 5) baseRate = 6000;
  else if (years >= 2) baseRate = 5000;
  else if (years > 0) baseRate = 4000;

  // エリアによる補正（最も高いエリアボーナスを採用）
  const areaBonus: Record<string, number> = {
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
  const maxAreaBonus = (answers.desiredAreas ?? []).reduce(
    (max, area) => Math.max(max, areaBonus[area] ?? 0),
    0
  );
  baseRate += maxAreaBonus;

  // 過去時給による補正
  if (answers.previousHourlyRate && answers.previousHourlyRate > baseRate) {
    baseRate = Math.round((baseRate + answers.previousHourlyRate) / 2);
  }

  // ランク判定
  let rank: CastRank = "C";
  if (baseRate >= 7000) rank = "S";
  else if (baseRate >= 5500) rank = "A";
  else if (baseRate >= 4000) rank = "B";

  // 月収計算（出勤日数ベース、1日6時間想定）
  const daysPerWeek = answers.availableDaysPerWeek ?? 3;
  const monthlyIncome = baseRate * 6 * daysPerWeek * 4;

  const primaryArea = answers.desiredAreas?.[0] ?? "都内";

  return {
    estimatedRank: rank,
    estimatedHourlyRate: baseRate,
    estimatedMonthlyIncome: monthlyIncome,
    matchingStoreIds: ["store_1", "store_2", "store_3"],
    analysis: {
      strengths:
        answers.strengths || ["コミュニケーション力", "明るい性格"],
      improvements: ["接客スキル向上", "エリア知識の習得"],
      recommendation: `あなたの経験と希望を考慮すると、${primaryArea}エリアでの勤務がおすすめです。`,
    },
  };
}
