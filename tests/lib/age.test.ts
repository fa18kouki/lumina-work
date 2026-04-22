import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateAge } from "@/lib/age";

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 基準日を 2026-04-22 に固定
    vi.setSystemTime(new Date("2026-04-22T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("誕生日が基準日より前の年の場合、単純な年の差を返す", () => {
    // 2000-03-15 生まれ → 2026-04-22 時点で 26 歳（今年の誕生日は過ぎている）
    expect(calculateAge(new Date("2000-03-15"))).toBe(26);
  });

  it("今年の誕生日がまだ来ていない場合、年の差から 1 を引く", () => {
    // 2000-05-01 生まれ → 2026-04-22 時点で 25 歳（今年の誕生日はまだ来ていない）
    expect(calculateAge(new Date("2000-05-01"))).toBe(25);
  });

  it("誕生日当日の場合、満年齢を返す", () => {
    // 2000-04-22 生まれ → 2026-04-22 は誕生日当日、26 歳
    expect(calculateAge(new Date("2000-04-22"))).toBe(26);
  });

  it("うるう年 2/29 生まれは、非うるう年では 3/1 に加齢扱い", () => {
    // 2000-02-29 生まれ → 2026-04-22 時点で 26 歳（4/22 は 3/1 以降）
    expect(calculateAge(new Date("2000-02-29"))).toBe(26);
  });

  it("未来日を渡した場合は 0 を返す（防御的挙動）", () => {
    expect(calculateAge(new Date("2030-01-01"))).toBe(0);
  });

  it("1 歳未満（誕生日前）は 0 を返す", () => {
    // 2025-06-01 生まれ → 2026-04-22 時点で 10 ヶ月 → 0 歳
    expect(calculateAge(new Date("2025-06-01"))).toBe(0);
  });
});
