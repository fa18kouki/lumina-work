import { describe, it, expect } from "vitest";
import { deriveProfileCompletenessPercent } from "@/lib/profile-completeness";

describe("deriveProfileCompletenessPercent", () => {
  it("全フィールド未入力かつ職歴なしの場合は 0 を返す", () => {
    const percent = deriveProfileCompletenessPercent({
      cast: {},
      workHistories: [],
    });
    expect(percent).toBe(0);
  });

  it("カテゴリ1 の fullName だけ入力した場合でも 0 より大きい値を返す", () => {
    const percent = deriveProfileCompletenessPercent({
      cast: { fullName: "山田花子" },
      workHistories: [],
    });
    expect(percent).toBeGreaterThan(0);
  });

  it("emergencyContact がオブジェクトで相手情報があれば充実度に反映される", () => {
    const withEC = deriveProfileCompletenessPercent({
      cast: {
        emergencyContact: { relation: "母", name: "山田花子", phone: "090-1234-5678" },
      },
      workHistories: [],
    });
    const withoutEC = deriveProfileCompletenessPercent({
      cast: {},
      workHistories: [],
    });
    expect(withEC).toBeGreaterThan(withoutEC);
  });

  it("職歴を 1 件以上登録するとカテゴリ6 (weight 15) が加点される", () => {
    const withHistory = deriveProfileCompletenessPercent({
      cast: {},
      workHistories: [{ storeName: "テスト店" }],
    });
    const withoutHistory = deriveProfileCompletenessPercent({
      cast: {},
      workHistories: [],
    });
    expect(withHistory - withoutHistory).toBe(15);
  });

  it("返却される値は 0〜100 の整数である", () => {
    const percent = deriveProfileCompletenessPercent({
      cast: {
        fullName: "山田花子",
        furigana: "ヤマダハナコ",
        phoneNumber: "090-1234-5678",
      },
      workHistories: [{ storeName: "テスト店" }],
    });
    expect(Number.isInteger(percent)).toBe(true);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });
});
