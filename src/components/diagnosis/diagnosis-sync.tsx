"use client";

import { useEffect, useRef } from "react";
import {
  clearDiagnosisSession,
  getDiagnosisSession,
} from "@/lib/diagnosis-session";
import { useAppSession } from "@/lib/auth-helpers";

/**
 * 未認証で受けた診断 (sessionStorage に蓄積) を、ログイン直後に Cast へ反映する。
 * - role=CAST の認証済 session を検知
 * - sessionStorage に未消費の answers があれば /api/auth/apply-diagnosis-to-cast へ POST
 * - 成功すれば sessionStorage を消費 (clear)
 *
 * /c/(app) layout にマウントすることで、 LINE 登録直後に dashboard 等へ遷移したタイミングで自動同期される。
 */
export function DiagnosisSync() {
  const { data: session, status } = useAppSession();
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    if (status !== "authenticated") return;
    if (!session?.user) return;
    if (session.user.role !== "CAST") return;

    const diag = getDiagnosisSession();
    const answers = diag?.answers;
    if (!answers) return;

    // 反映できそうな値が 1 つも無ければ skip (空オブジェクトで API を叩くのを避ける)
    const hasContent =
      answers.age !== undefined ||
      answers.totalExperienceYears !== undefined ||
      (answers.desiredAreas && answers.desiredAreas.length > 0) ||
      answers.desiredHourlyRate !== undefined ||
      answers.availableDaysPerWeek !== undefined ||
      !!answers.alcoholTolerance ||
      (answers.preferredAtmosphere && answers.preferredAtmosphere.length > 0) ||
      (answers.photos && answers.photos.length > 0);
    if (!hasContent) return;

    submittedRef.current = true;

    const payload: Record<string, unknown> = {};
    if (typeof answers.age === "number") payload.age = answers.age;
    if (typeof answers.totalExperienceYears === "number")
      payload.totalExperienceYears = answers.totalExperienceYears;
    if (Array.isArray(answers.desiredAreas) && answers.desiredAreas.length > 0)
      payload.desiredAreas = answers.desiredAreas;
    if (typeof answers.desiredHourlyRate === "number")
      payload.desiredHourlyRate = answers.desiredHourlyRate;
    if (typeof answers.availableDaysPerWeek === "number")
      payload.availableDaysPerWeek = answers.availableDaysPerWeek;
    if (typeof answers.alcoholTolerance === "string")
      payload.alcoholTolerance = answers.alcoholTolerance;
    if (
      Array.isArray(answers.preferredAtmosphere) &&
      answers.preferredAtmosphere.length > 0
    )
      payload.preferredAtmosphere = answers.preferredAtmosphere;
    if (Array.isArray(answers.photos) && answers.photos.length > 0)
      payload.photos = answers.photos;

    fetch("/api/auth/apply-diagnosis-to-cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.ok) {
          clearDiagnosisSession();
        } else {
          // 反映に失敗しても次回ログイン時に再試行できるよう sessionStorage は残す
          submittedRef.current = false;
          if (process.env.NODE_ENV !== "production") {
            const text = await res.text().catch(() => "");
            // eslint-disable-next-line no-console
            console.warn("[diagnosis-sync] apply failed", res.status, text);
          }
        }
      })
      .catch((e) => {
        submittedRef.current = false;
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[diagnosis-sync] network error", e);
        }
      });
  }, [status, session]);

  return null;
}
