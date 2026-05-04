"use client";

import { calculateBaseRate, calculateRank } from "./diagnosis/calculate-rank";

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

// Storage migration:
//   旧バージョンは sessionStorage を使っていたが、 LINE 認証から戻った直後に
//   tab/オリジン跨ぎでセッションが失われ、Cast への診断データ反映が失われていた。
//   そのため localStorage に保管先を変更する。一方、既存ユーザーが診断途中で
//   バージョンが上がるケースを救うため、 sessionStorage に残っているデータが
//   あれば 1 度だけ localStorage に移し替える。

function readFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readFromSessionStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToLocalStorage(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // quota / private mode 等で書けないケースは諦める
  }
}

function removeFromLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

function removeFromSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
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

  writeToLocalStorage(JSON.stringify(session));

  return session;
}

// セッション取得
export function getDiagnosisSession(): DiagnosisSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  let stored = readFromLocalStorage();

  // ワンタイム migration: localStorage に無く、 sessionStorage にだけあるなら
  // 移し替えてから返す。
  if (!stored) {
    const legacy = readFromSessionStorage();
    if (legacy) {
      writeToLocalStorage(legacy);
      removeFromSessionStorage();
      stored = legacy;
    }
  }

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

  writeToLocalStorage(JSON.stringify(updatedSession));

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

// セッション削除 (新旧両方の保管先をクリア)
export function clearDiagnosisSession(): void {
  removeFromLocalStorage();
  removeFromSessionStorage();
}

// セッションが存在するか確認
export function hasDiagnosisSession(): boolean {
  return getDiagnosisSession() !== null;
}

// 診断結果を計算
export function calculateDiagnosisResult(
  answers: DiagnosisAnswers
): DiagnosisResult {
  const baseRate = calculateBaseRate({
    totalExperienceYears: answers.totalExperienceYears,
    desiredAreas: answers.desiredAreas,
    previousHourlyRate: answers.previousHourlyRate,
  });
  const rank: CastRank = calculateRank({
    totalExperienceYears: answers.totalExperienceYears,
    desiredAreas: answers.desiredAreas,
    previousHourlyRate: answers.previousHourlyRate,
  });

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
