"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type DiagnosisSession,
  type DiagnosisStep,
  type DiagnosisAnswers,
  type DiagnosisResult,
  createDiagnosisSession,
  getDiagnosisSession,
  updateDiagnosisStep,
  addDiagnosisAnswers,
  setDiagnosisResult,
  clearDiagnosisSession,
  calculateDiagnosisResult,
} from "./diagnosis-session";

interface DiagnosisContextValue {
  session: DiagnosisSession | null;
  isLoading: boolean;
  // セッション操作
  startDiagnosis: () => DiagnosisSession;
  updateStep: (step: DiagnosisStep) => void;
  addAnswers: (answers: Partial<DiagnosisAnswers>) => void;
  completeInterview: () => DiagnosisResult | null;
  reset: () => void;
  // RUN-248: 診断セッションを消費済みにする (localStorage をクリア)
  clearSession: () => void;
  // ヘルパー
  hasSession: boolean;
  currentStep: DiagnosisStep | null;
}

const DiagnosisContext = createContext<DiagnosisContextValue | null>(null);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にセッションを読み込む
  useEffect(() => {
    const existingSession = getDiagnosisSession();
    setSession(existingSession);
    setIsLoading(false);
  }, []);

  // 診断開始
  const startDiagnosis = useCallback(() => {
    const newSession = createDiagnosisSession();
    setSession(newSession);
    return newSession;
  }, []);

  // ステップ更新
  const updateStep = useCallback((step: DiagnosisStep) => {
    const updated = updateDiagnosisStep(step);
    if (updated) {
      setSession(updated);
    }
  }, []);

  // 回答追加
  const addAnswers = useCallback((answers: Partial<DiagnosisAnswers>) => {
    const updated = addDiagnosisAnswers(answers);
    if (updated) {
      setSession(updated);
    }
  }, []);

  // 面談完了・結果計算
  const completeInterview = useCallback(() => {
    if (!session) return null;

    const result = calculateDiagnosisResult(session.answers);
    const updated = setDiagnosisResult(result);
    if (updated) {
      setSession(updated);
    }
    return result;
  }, [session]);

  // リセット
  const reset = useCallback(() => {
    clearDiagnosisSession();
    setSession(null);
  }, []);

  const clearSession = reset;

  const value: DiagnosisContextValue = {
    session,
    isLoading,
    startDiagnosis,
    updateStep,
    addAnswers,
    completeInterview,
    reset,
    clearSession,
    hasSession: session !== null,
    currentStep: session?.step ?? null,
  };

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }
  return context;
}
