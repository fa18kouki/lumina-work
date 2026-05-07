/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  type DiagnosisAnswers,
  createDiagnosisSession,
  getDiagnosisSession,
  addDiagnosisAnswers,
  calculateDiagnosisResult,
  clearDiagnosisSession,
} from "@/lib/diagnosis-session";

describe("diagnosis-session", () => {
  beforeEach(() => {
    clearDiagnosisSession();
  });

  describe("DiagnosisAnswers 型とフィールド名", () => {
    it("totalExperienceYears フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({ totalExperienceYears: 3 });
      expect(updated?.answers.totalExperienceYears).toBe(3);
    });

    it("desiredAreas フィールド (配列) が保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({
        desiredAreas: ["六本木", "銀座"],
      });
      expect(updated?.answers.desiredAreas).toEqual(["六本木", "銀座"]);
    });

    it("previousHourlyRate フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({ previousHourlyRate: 5000 });
      expect(updated?.answers.previousHourlyRate).toBe(5000);
    });

    it("availableDaysPerWeek フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({ availableDaysPerWeek: 3 });
      expect(updated?.answers.availableDaysPerWeek).toBe(3);
    });

    it("desiredHourlyRate フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({ desiredHourlyRate: 6000 });
      expect(updated?.answers.desiredHourlyRate).toBe(6000);
    });

    it("alcoholTolerance フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({ alcoholTolerance: "STRONG" });
      expect(updated?.answers.alcoholTolerance).toBe("STRONG");
    });

    it("preferredAtmosphere フィールド (配列) が保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({
        preferredAtmosphere: ["落ち着いた店", "高級感のある店"],
      });
      expect(updated?.answers.preferredAtmosphere).toEqual([
        "落ち着いた店",
        "高級感のある店",
      ]);
    });

    it("strengths フィールドが保存できる", () => {
      createDiagnosisSession();
      const updated = addDiagnosisAnswers({
        strengths: ["コミュニケーション力", "容姿"],
      });
      expect(updated?.answers.strengths).toEqual([
        "コミュニケーション力",
        "容姿",
      ]);
    });
  });

  describe("calculateDiagnosisResult", () => {
    it("未経験・低時給でもCランクが返る", () => {
      const answers: DiagnosisAnswers = {
        totalExperienceYears: 0,
        desiredAreas: ["渋谷"],
        previousHourlyRate: 3000,
        availableDaysPerWeek: 3,
      };
      const result = calculateDiagnosisResult(answers);
      expect(result.estimatedRank).toBe("C");
      expect(result.estimatedHourlyRate).toBeGreaterThan(0);
      expect(result.estimatedMonthlyIncome).toBeGreaterThan(0);
    });

    it("経験豊富・銀座エリアでSランクが返る", () => {
      const answers: DiagnosisAnswers = {
        totalExperienceYears: 5,
        desiredAreas: ["銀座"],
        previousHourlyRate: 8000,
        availableDaysPerWeek: 5,
      };
      const result = calculateDiagnosisResult(answers);
      expect(result.estimatedRank).toBe("S");
      expect(result.estimatedHourlyRate).toBeGreaterThanOrEqual(7000);
    });

    it("中間的な経験でBまたはAランクが返る", () => {
      const answers: DiagnosisAnswers = {
        totalExperienceYears: 2,
        desiredAreas: ["新宿"],
        previousHourlyRate: 5000,
        availableDaysPerWeek: 3,
      };
      const result = calculateDiagnosisResult(answers);
      expect(["A", "B"]).toContain(result.estimatedRank);
    });

    it("matchingStoreIds が返る", () => {
      const answers: DiagnosisAnswers = {
        totalExperienceYears: 1,
        desiredAreas: ["六本木"],
      };
      const result = calculateDiagnosisResult(answers);
      expect(result.matchingStoreIds.length).toBeGreaterThan(0);
    });

    it("analysis が strengths と recommendation を含む", () => {
      const answers: DiagnosisAnswers = {
        totalExperienceYears: 2,
        desiredAreas: ["銀座"],
        strengths: ["コミュニケーション力"],
      };
      const result = calculateDiagnosisResult(answers);
      expect(result.analysis.strengths).toBeDefined();
      expect(result.analysis.recommendation).toBeDefined();
      expect(result.analysis.strengths).toContain("コミュニケーション力");
    });
  });

  describe("セッション管理", () => {
    it("セッション作成後に取得できる", () => {
      const session = createDiagnosisSession();
      const retrieved = getDiagnosisSession();
      expect(retrieved?.id).toBe(session.id);
    });

    it("回答を段階的に追加できる", () => {
      createDiagnosisSession();
      addDiagnosisAnswers({ totalExperienceYears: 3 });
      addDiagnosisAnswers({ desiredAreas: ["銀座"] });

      const session = getDiagnosisSession();
      expect(session?.answers.totalExperienceYears).toBe(3);
      expect(session?.answers.desiredAreas).toEqual(["銀座"]);
    });

    it("クリア後はセッションが取得できない", () => {
      createDiagnosisSession();
      clearDiagnosisSession();
      expect(getDiagnosisSession()).toBeNull();
    });
  });

  // BUG (storage migration): sessionStorage → localStorage 移行 + ワンタイム互換
  describe("storage migration (sessionStorage → localStorage)", () => {
    const STORAGE_KEY = "diagnosis_session";

    // Node 25 + jsdom の組合せでは window.localStorage が Node native (read-only) で
    // 上書きされていることがあるので、自前の in-memory Storage に強制差し替えする。
    function makeMemStorage(): Storage {
      const map = new Map<string, string>();
      const api: Storage = {
        get length() {
          return map.size;
        },
        clear: () => map.clear(),
        getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
        key: (i: number) => Array.from(map.keys())[i] ?? null,
        removeItem: (k: string) => {
          map.delete(k);
        },
        setItem: (k: string, v: string) => {
          map.set(k, String(v));
        },
      };
      return api;
    }

    beforeEach(() => {
      // 両方を新しい in-memory Storage で差し替え
      Object.defineProperty(window, "localStorage", {
        value: makeMemStorage(),
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, "sessionStorage", {
        value: makeMemStorage(),
        configurable: true,
        writable: true,
      });
    });

    it("createDiagnosisSession は localStorage に保存される (sessionStorage には書き込まない)", () => {
      const session = createDiagnosisSession();
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) as string,
      );
      expect(stored.id).toBe(session.id);
      expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("ページ再読み込みを模した別 import 経由でも localStorage から取得できる", () => {
      const created = createDiagnosisSession();
      // 同じ window.localStorage を読みに行くだけだが、
      // sessionStorage では tab を超えて生き残らないことの裏返しを表現
      const got = getDiagnosisSession();
      expect(got?.id).toBe(created.id);
    });

    it("sessionStorage にだけデータがある (旧バージョンユーザー) → getDiagnosisSession 後に localStorage に migration される", () => {
      const legacy = {
        id: "diag_legacy",
        step: "BASIC",
        answers: { age: 25 },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

      const got = getDiagnosisSession();
      expect(got?.id).toBe("diag_legacy");
      // migration 完了: localStorage 側に乗り換わっている
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      const migrated = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) as string,
      );
      expect(migrated.id).toBe("diag_legacy");
    });

    it("clearDiagnosisSession は localStorage と sessionStorage の両方を削除する", () => {
      window.localStorage.setItem(STORAGE_KEY, '{"id":"a"}');
      window.sessionStorage.setItem(STORAGE_KEY, '{"id":"b"}');
      clearDiagnosisSession();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
