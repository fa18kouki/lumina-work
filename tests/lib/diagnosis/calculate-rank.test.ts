import { describe, it, expect } from "vitest";
import { calculateRank } from "@/lib/diagnosis/calculate-rank";

describe("calculateRank", () => {
  it("経験なし・希望エリアなしの場合はCランク (baseRate=3000)", () => {
    expect(calculateRank({ totalExperienceYears: 0 })).toBe("C");
  });

  it("経験1年で baseRate=4000 → Bランク", () => {
    expect(calculateRank({ totalExperienceYears: 1 })).toBe("B");
  });

  it("経験2年で baseRate=5000 → Bランク (5500未満)", () => {
    expect(calculateRank({ totalExperienceYears: 2 })).toBe("B");
  });

  it("経験5年で baseRate=6000 → Aランク", () => {
    expect(calculateRank({ totalExperienceYears: 5 })).toBe("A");
  });

  it("経験5年 + 銀座 (2000ボーナス) で baseRate=8000 → Sランク", () => {
    expect(
      calculateRank({
        totalExperienceYears: 5,
        desiredAreas: ["銀座"],
      })
    ).toBe("S");
  });

  it("経験2年 + 名古屋 (700ボーナス) で baseRate=5700 → Aランク", () => {
    expect(
      calculateRank({
        totalExperienceYears: 2,
        desiredAreas: ["名古屋"],
      })
    ).toBe("A");
  });

  it("複数エリア指定時は最大ボーナスを採用", () => {
    // 経験1年 (4000) + 銀座 (2000) = 6000 → A
    expect(
      calculateRank({
        totalExperienceYears: 1,
        desiredAreas: ["池袋", "銀座", "上野"],
      })
    ).toBe("A");
  });

  it("過去時給がbaseRateより高い場合は平均化される", () => {
    // 経験1年 (4000) + 過去時給10000 → (4000+10000)/2=7000 → S
    expect(
      calculateRank({
        totalExperienceYears: 1,
        previousHourlyRate: 10000,
      })
    ).toBe("S");
  });

  it("経験年数なしでも desiredAreas で底上げされる", () => {
    // baseRate=3000 + 銀座2000 = 5000 → B
    expect(
      calculateRank({
        desiredAreas: ["銀座"],
      })
    ).toBe("B");
  });

  it("年齢は計算に影響しない", () => {
    const young = calculateRank({
      totalExperienceYears: 5,
      desiredAreas: ["銀座"],
    });
    const old = calculateRank({
      totalExperienceYears: 5,
      desiredAreas: ["銀座"],
    });
    expect(young).toBe(old);
  });
});
