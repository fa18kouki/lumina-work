import type { DiagnosisSession } from "./diagnosis-session";

export interface ResolveLoginCallbackInput {
  diagnosisId: string | null;
  fromDiagnosisParam: string | null;
  diagnosisSession: DiagnosisSession | null;
}

export interface ResolveLoginCallbackResult {
  fromDiagnosis: boolean;
  callbackUrl: string;
}

// RUN-248: fromDiagnosis は「診断結果が未消費」= localStorage のセッションに result が残っている
// 状態に限定する。URL パラメータだけでは判定しない(消費済みセッションでループするバグの回帰防止)。
export function resolveLoginCallback(
  input: ResolveLoginCallbackInput
): ResolveLoginCallbackResult {
  const hasUnconsumedResult = Boolean(input.diagnosisSession?.result);

  const fromDiagnosis = hasUnconsumedResult;
  const callbackUrl = fromDiagnosis ? "/c/profile" : "/c/dashboard";

  return { fromDiagnosis, callbackUrl };
}
