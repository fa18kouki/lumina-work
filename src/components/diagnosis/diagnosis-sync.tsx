"use client";

import { useEffect, useRef } from "react";
import {
  clearDiagnosisSession,
  getDiagnosisSession,
} from "@/lib/diagnosis-session";
import { useAppSession } from "@/lib/auth-helpers";

/**
 * 未認証で受けた診断 (localStorage に蓄積) を、ログイン直後に Cast へ反映する。
 * - role=CAST の認証済 session を検知
 * - localStorage に未消費の answers があれば /api/auth/apply-diagnosis-to-cast へ POST
 * - 成功すれば localStorage を消費 (clear)
 *
 * /c/(app) layout にマウントすることで、 LINE 登録直後に dashboard 等へ遷移したタイミングで自動同期される。
 */
export function DiagnosisSync() {
  const { data: session, status } = useAppSession();
  const submittedRef = useRef(false);

  // H-1: deps を [status, session] にすると session 参照が変わる毎に effect が再走り、
  //   失敗で submittedRef が戻った後の race で多重 fetch する。
  //   id/role というプリミティブだけを deps に入れて再実行を最小化する。
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  useEffect(() => {
    if (submittedRef.current) return;
    if (status !== "authenticated") return;
    if (!session?.user) return;

    // H-2: 端末共有ケース — OWNER 等が LINE ログインした際、
    //   前のキャストの診断データが localStorage に残っていると誤マージされる。
    //   role !== "CAST" の認証済セッションでは localStorage をクリアして抜ける。
    //   unauthenticated は「これからログインする可能性」があるので消さない。
    if (session.user.role !== "CAST") {
      clearDiagnosisSession();
      return;
    }

    const diag = getDiagnosisSession();
    const answers = diag?.answers;
    if (!answers) return;

    // 反映できそうな値が 1 つも無ければ skip (空オブジェクトで API を叩くのを避ける)
    const hasContent =
      !!answers.nickname ||
      answers.age !== undefined ||
      !!answers.birthDate ||
      !!answers.instagramId ||
      !!answers.lineId ||
      !!answers.currentListingUrl ||
      answers.totalExperienceYears !== undefined ||
      answers.previousHourlyRate !== undefined ||
      answers.monthlySales !== undefined ||
      answers.monthlyNominations !== undefined ||
      (answers.desiredAreas && answers.desiredAreas.length > 0) ||
      answers.desiredHourlyRate !== undefined ||
      answers.desiredMonthlyIncome !== undefined ||
      answers.availableDaysPerWeek !== undefined ||
      !!answers.alcoholTolerance ||
      (answers.preferredAtmosphere && answers.preferredAtmosphere.length > 0) ||
      (answers.preferredClientele && answers.preferredClientele.length > 0) ||
      answers.birthdaySales !== undefined ||
      answers.hasVipClients !== undefined ||
      !!answers.vipClientDescription ||
      answers.socialFollowers !== undefined ||
      answers.isAvailableNow !== undefined ||
      !!answers.downtimeUntil ||
      (answers.photos && answers.photos.length > 0) ||
      (answers.strengths && answers.strengths.length > 0);
    if (!hasContent) return;

    submittedRef.current = true;

    const payload: Record<string, unknown> = {};
    if (typeof answers.nickname === "string") payload.nickname = answers.nickname;
    if (typeof answers.age === "number") payload.age = answers.age;
    if (typeof answers.birthDate === "string") payload.birthDate = answers.birthDate;
    if (typeof answers.instagramId === "string")
      payload.instagramId = answers.instagramId;
    if (typeof answers.lineId === "string") payload.lineId = answers.lineId;
    if (
      typeof answers.currentListingUrl === "string" &&
      /^https:\/\//i.test(answers.currentListingUrl)
    )
      payload.currentListingUrl = answers.currentListingUrl;
    if (typeof answers.totalExperienceYears === "number")
      payload.totalExperienceYears = answers.totalExperienceYears;
    if (typeof answers.previousHourlyRate === "number")
      payload.previousHourlyRate = answers.previousHourlyRate;
    if (typeof answers.monthlySales === "number")
      payload.monthlySales = answers.monthlySales;
    if (typeof answers.monthlyNominations === "number")
      payload.monthlyNominations = answers.monthlyNominations;
    if (Array.isArray(answers.desiredAreas) && answers.desiredAreas.length > 0)
      payload.desiredAreas = answers.desiredAreas;
    if (typeof answers.desiredHourlyRate === "number")
      payload.desiredHourlyRate = answers.desiredHourlyRate;
    if (typeof answers.desiredMonthlyIncome === "number")
      payload.desiredMonthlyIncome = answers.desiredMonthlyIncome;
    if (typeof answers.availableDaysPerWeek === "number")
      payload.availableDaysPerWeek = answers.availableDaysPerWeek;
    if (typeof answers.alcoholTolerance === "string")
      payload.alcoholTolerance = answers.alcoholTolerance;
    if (
      Array.isArray(answers.preferredAtmosphere) &&
      answers.preferredAtmosphere.length > 0
    )
      payload.preferredAtmosphere = answers.preferredAtmosphere;
    if (
      Array.isArray(answers.preferredClientele) &&
      answers.preferredClientele.length > 0
    )
      payload.preferredClientele = answers.preferredClientele;
    if (typeof answers.birthdaySales === "number")
      payload.birthdaySales = answers.birthdaySales;
    if (typeof answers.hasVipClients === "boolean")
      payload.hasVipClients = answers.hasVipClients;
    if (typeof answers.vipClientDescription === "string")
      payload.vipClientDescription = answers.vipClientDescription;
    if (typeof answers.socialFollowers === "number")
      payload.socialFollowers = answers.socialFollowers;
    if (typeof answers.isAvailableNow === "boolean")
      payload.isAvailableNow = answers.isAvailableNow;
    if (typeof answers.downtimeUntil === "string")
      payload.downtimeUntil = answers.downtimeUntil;
    // BUG-6 + C-2: photos は https:// 始まりの URL のみ送信する allowlist 方式。
    //   blob: / Blob: / BLOB: / data: / javascript: / file:// / http:// 等を全て弾く。
    //   サーバ側 (route.ts) でも同じ allowlist で防御する。
    if (Array.isArray(answers.photos) && answers.photos.length > 0) {
      const persistablePhotos = answers.photos.filter(
        (u): u is string => typeof u === "string" && /^https:\/\//i.test(u),
      );
      if (persistablePhotos.length > 0) payload.photos = persistablePhotos;
    }
    // BUG-3: strengths は API 側で Cast.description の末尾に追記される
    if (Array.isArray(answers.strengths) && answers.strengths.length > 0)
      payload.strengths = answers.strengths;

    fetch("/api/auth/apply-diagnosis-to-cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (res.ok) {
          clearDiagnosisSession();
        } else {
          // 反映に失敗しても次回ログイン時に再試行できるよう localStorage は残す
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId, userRole]);

  return null;
}
