import { describe, it, expect } from "vitest";
import { resolveLoginCallback } from "@/lib/login-callback";
import type { DiagnosisSession, DiagnosisResult } from "@/lib/diagnosis-session";

const sampleResult: DiagnosisResult = {
  estimatedRank: "A",
  estimatedHourlyRate: 5000,
  estimatedMonthlyIncome: 800000,
  matchingStoreIds: ["store-1"],
  analysis: {
    strengths: ["笑顔"],
    improvements: ["経験を増やす"],
    recommendation: "A ランク相当",
  },
};

function buildSession(overrides: Partial<DiagnosisSession> = {}): DiagnosisSession {
  return {
    id: "diag_test_1",
    step: "RESULT",
    answers: { age: 25 },
    result: sampleResult,
    createdAt: "2026-04-22T00:00:00.000Z",
    expiresAt: "2026-04-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveLoginCallback", () => {
  it("未診断の既存ユーザーは /c/dashboard に戻る (デフォルト)", () => {
    const r = resolveLoginCallback({
      diagnosisId: null,
      fromDiagnosisParam: null,
      diagnosisSession: null,
    });

    expect(r.fromDiagnosis).toBe(false);
    expect(r.callbackUrl).toBe("/c/dashboard");
  });

  it("診断結果が未消費 (session.result あり) の場合のみ /c/profile へ送る", () => {
    const r = resolveLoginCallback({
      diagnosisId: null,
      fromDiagnosisParam: null,
      diagnosisSession: buildSession(),
    });

    expect(r.fromDiagnosis).toBe(true);
    expect(r.callbackUrl).toBe("/c/profile");
  });

  it("session は残っているが result が無い場合は fromDiagnosis=false (回帰テスト: 消費済みセッションで /c/profile に戻る不具合)", () => {
    // RUN-248 のバグ: diagnosisSession が残ると常に /c/profile に飛ぶ問題
    const staleSession = buildSession({ result: undefined, step: "INTERVIEW" });

    const r = resolveLoginCallback({
      diagnosisId: null,
      fromDiagnosisParam: null,
      diagnosisSession: staleSession,
    });

    expect(r.fromDiagnosis).toBe(false);
    expect(r.callbackUrl).toBe("/c/dashboard");
  });

  it("URL パラメータ fromDiagnosis=true でも result が無ければ fromDiagnosis=false", () => {
    // 「診断結果が未消費」に限定するため、URL パラメータ単独では診断フローと見なさない
    const r = resolveLoginCallback({
      diagnosisId: null,
      fromDiagnosisParam: "true",
      diagnosisSession: null,
    });

    expect(r.fromDiagnosis).toBe(false);
    expect(r.callbackUrl).toBe("/c/dashboard");
  });

  it("URL パラメータ diagnosisId があり result も未消費なら /c/profile", () => {
    const r = resolveLoginCallback({
      diagnosisId: "diag_123",
      fromDiagnosisParam: null,
      diagnosisSession: buildSession(),
    });

    expect(r.fromDiagnosis).toBe(true);
    expect(r.callbackUrl).toBe("/c/profile");
  });

  it("/c/ai-diagnosis (RUN-245 で削除済み) には決して送らない", () => {
    const r = resolveLoginCallback({
      diagnosisId: "diag_123",
      fromDiagnosisParam: "true",
      diagnosisSession: buildSession(),
    });

    expect(r.callbackUrl).not.toBe("/c/ai-diagnosis");
  });
});
