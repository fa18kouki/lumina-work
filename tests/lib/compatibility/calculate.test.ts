import { describe, it, expect } from "vitest";
import {
  calculateCompatibility,
  type CompatibilityResult,
} from "@/lib/compatibility/calculate";

describe("calculateCompatibility", () => {
  it("相性%が60〜99の範囲に収まる", () => {
    const result = calculateCompatibility("あいこ", "たろう");
    expect(result.percentage).toBeGreaterThanOrEqual(60);
    expect(result.percentage).toBeLessThanOrEqual(99);
  });

  it("整数値を返す", () => {
    const result = calculateCompatibility("さくら", "けんた");
    expect(Number.isInteger(result.percentage)).toBe(true);
  });

  it("タイプ名が6種類のいずれかである", () => {
    const validTypes = [
      "運命の二人",
      "最高のパートナー",
      "息ぴったり",
      "気になる存在",
      "これから伸びる関係",
      "ミステリアスな縁",
    ];
    const result = calculateCompatibility("みく", "ゆうた");
    expect(validTypes).toContain(result.typeName);
  });

  it("コメントが空でない文字列を返す", () => {
    const result = calculateCompatibility("りな", "しょうた");
    expect(result.comment.length).toBeGreaterThan(0);
  });

  it("詳細3項目（会話・笑い・フィーリング）を含む", () => {
    const result = calculateCompatibility("まい", "こうへい");
    expect(result.details).toHaveLength(3);
    expect(result.details[0].label).toBe("会話の相性");
    expect(result.details[1].label).toBe("笑いの相性");
    expect(result.details[2].label).toBe("フィーリング");
  });

  it("詳細項目の星は1〜5の整数値", () => {
    const result = calculateCompatibility("あや", "だいき");
    for (const detail of result.details) {
      expect(detail.stars).toBeGreaterThanOrEqual(1);
      expect(detail.stars).toBeLessThanOrEqual(5);
      expect(Number.isInteger(detail.stars)).toBe(true);
    }
  });

  it("異なる名前の組み合わせで異なる結果が出る可能性がある", () => {
    const results = new Set<number>();
    const names = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"];
    for (const name of names) {
      const result = calculateCompatibility(name, "テスト");
      results.add(result.percentage);
    }
    // 10パターンで全て同じ結果になることはない
    expect(results.size).toBeGreaterThan(1);
  });

  it("名前の順序を入れ替えても同じ結果になる", () => {
    const result1 = calculateCompatibility("あいこ", "たろう");
    const result2 = calculateCompatibility("たろう", "あいこ");
    expect(result1.percentage).toBe(result2.percentage);
    expect(result1.typeName).toBe(result2.typeName);
  });

  it("CompatibilityResult型の構造を満たす", () => {
    const result: CompatibilityResult = calculateCompatibility("テスト", "テスト2");
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("typeName");
    expect(result).toHaveProperty("comment");
    expect(result).toHaveProperty("details");
  });
});
