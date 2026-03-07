import { describe, it, expect } from "vitest";
import {
  calculateCompatibility,
  getZodiacSign,
  getLifePathNumber,
  type CompatibilityInput,
  type CompatibilityResult,
} from "@/lib/compatibility/calculate";

const makeInput = (
  overrides?: Partial<{
    name1: string;
    name2: string;
    month1: number;
    day1: number;
    bloodType1: string;
    month2: number;
    day2: number;
    bloodType2: string;
  }>
): CompatibilityInput => ({
  name1: overrides?.name1 ?? "あいこ",
  month1: overrides?.month1 ?? 3,
  day1: overrides?.day1 ?? 15,
  bloodType1: (overrides?.bloodType1 ?? "A") as CompatibilityInput["bloodType1"],
  name2: overrides?.name2 ?? "たろう",
  month2: overrides?.month2 ?? 7,
  day2: overrides?.day2 ?? 20,
  bloodType2: (overrides?.bloodType2 ?? "O") as CompatibilityInput["bloodType2"],
});

describe("getZodiacSign", () => {
  it.each([
    [1, 1, "やぎ座"],
    [1, 19, "やぎ座"],
    [1, 20, "みずがめ座"],
    [2, 19, "みずがめ座"],
    [2, 20, "うお座"],
    [3, 20, "うお座"],
    [3, 21, "おひつじ座"],
    [4, 19, "おひつじ座"],
    [4, 20, "おうし座"],
    [5, 20, "おうし座"],
    [5, 21, "ふたご座"],
    [6, 21, "ふたご座"],
    [6, 22, "かに座"],
    [7, 22, "かに座"],
    [7, 23, "しし座"],
    [8, 22, "しし座"],
    [8, 23, "おとめ座"],
    [9, 22, "おとめ座"],
    [9, 23, "てんびん座"],
    [10, 23, "てんびん座"],
    [10, 24, "さそり座"],
    [11, 22, "さそり座"],
    [11, 23, "いて座"],
    [12, 21, "いて座"],
    [12, 22, "やぎ座"],
    [12, 31, "やぎ座"],
  ])("月=%d 日=%d は %s", (month, day, expected) => {
    expect(getZodiacSign(month, day)).toBe(expected);
  });
});

describe("getLifePathNumber", () => {
  it("各桁を1桁になるまで足し合わせる", () => {
    // 3+15 = 18 → 1+8 = 9
    expect(getLifePathNumber(3, 15)).toBe(9);
  });

  it("11はマスターナンバーとして保持する", () => {
    // 2+9 = 11 → マスターナンバー
    expect(getLifePathNumber(2, 9)).toBe(11);
  });

  it("22はマスターナンバーとして保持する", () => {
    // 9+13 = 22 → マスターナンバー
    expect(getLifePathNumber(9, 13)).toBe(22);
  });

  it("1〜9または11,22を返す", () => {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        const result = getLifePathNumber(m, d);
        const valid = (result >= 1 && result <= 9) || result === 11 || result === 22;
        expect(valid).toBe(true);
      }
    }
  });
});

describe("calculateCompatibility", () => {
  it("相性%が60〜99の範囲に収まる", () => {
    const result = calculateCompatibility(makeInput());
    expect(result.percentage).toBeGreaterThanOrEqual(60);
    expect(result.percentage).toBeLessThanOrEqual(99);
  });

  it("整数値を返す", () => {
    const result = calculateCompatibility(makeInput({ name1: "さくら", name2: "けんた" }));
    expect(Number.isInteger(result.percentage)).toBe(true);
  });

  it("相性タイプ名が8種類のいずれかである", () => {
    const validTypes = [
      "運命の赤い糸",
      "魂のパートナー",
      "惹かれ合う情熱タイプ",
      "息ぴったりの名コンビ",
      "じわじわハマる相性",
      "意外性のスパイス",
      "これから花開く関係",
      "ミステリアスな引力",
    ];
    const result = calculateCompatibility(makeInput({ name1: "みく", name2: "ゆうた" }));
    expect(validTypes).toContain(result.typeName);
  });

  it("相性サマリーが空でない文字列を返す", () => {
    const result = calculateCompatibility(makeInput({ name1: "りな", name2: "しょうた" }));
    expect(result.comment.length).toBeGreaterThan(0);
  });

  it("詳細5項目を含む", () => {
    const result = calculateCompatibility(makeInput());
    expect(result.details).toHaveLength(5);
    const labels = result.details.map((d) => d.label);
    expect(labels).toContain("恋愛の相性");
    expect(labels).toContain("会話の相性");
    expect(labels).toContain("価値観の一致度");
    expect(labels).toContain("ドキドキ度");
    expect(labels).toContain("長続き度");
  });

  it("詳細項目の星は1〜5の整数値", () => {
    const result = calculateCompatibility(makeInput({ name1: "あや", name2: "だいき" }));
    for (const detail of result.details) {
      expect(detail.stars).toBeGreaterThanOrEqual(1);
      expect(detail.stars).toBeLessThanOrEqual(5);
      expect(Number.isInteger(detail.stars)).toBe(true);
    }
  });

  it("恋愛タイプが2人分返る", () => {
    const result = calculateCompatibility(makeInput());
    expect(result.loveType1).toBeDefined();
    expect(result.loveType1.name.length).toBeGreaterThan(0);
    expect(result.loveType1.description.length).toBeGreaterThan(0);
    expect(result.loveType2).toBeDefined();
    expect(result.loveType2.name.length).toBeGreaterThan(0);
    expect(result.loveType2.description.length).toBeGreaterThan(0);
  });

  it("ラッキー情報が返る", () => {
    const result = calculateCompatibility(makeInput());
    expect(result.lucky.color.length).toBeGreaterThan(0);
    expect(result.lucky.dateSpot.length).toBeGreaterThan(0);
  });

  it("アドバイスが返る", () => {
    const result = calculateCompatibility(makeInput());
    expect(result.advice.length).toBeGreaterThan(0);
  });

  it("名前の順序を入れ替えても同じ結果になる", () => {
    const input1 = makeInput();
    const input2: CompatibilityInput = {
      name1: input1.name2,
      month1: input1.month2,
      day1: input1.day2,
      bloodType1: input1.bloodType2,
      name2: input1.name1,
      month2: input1.month1,
      day2: input1.day1,
      bloodType2: input1.bloodType1,
    };
    const result1 = calculateCompatibility(input1);
    const result2 = calculateCompatibility(input2);
    expect(result1.percentage).toBe(result2.percentage);
    expect(result1.typeName).toBe(result2.typeName);
  });

  it("異なる入力で異なる結果が出る可能性がある", () => {
    const results = new Set<number>();
    for (let m = 1; m <= 10; m++) {
      const result = calculateCompatibility(
        makeInput({ name1: "テスト", month1: m, day1: 10 })
      );
      results.add(result.percentage);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("CompatibilityResult型の構造を満たす", () => {
    const result: CompatibilityResult = calculateCompatibility(makeInput());
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("typeName");
    expect(result).toHaveProperty("comment");
    expect(result).toHaveProperty("details");
    expect(result).toHaveProperty("loveType1");
    expect(result).toHaveProperty("loveType2");
    expect(result).toHaveProperty("lucky");
    expect(result).toHaveProperty("advice");
  });
});
