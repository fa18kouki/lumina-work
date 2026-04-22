import { describe, it, expect } from "vitest";
import { pickDashboardTheme, DASHBOARD_THEMES } from "@/lib/dashboard/pickTheme";

describe("pickDashboardTheme", () => {
  it("同じ userId に対しては常に同じテーマを返す（決定論）", () => {
    const userId = "user-abc-123";
    const first = pickDashboardTheme(userId);
    for (let i = 0; i < 50; i++) {
      expect(pickDashboardTheme(userId)).toEqual(first);
    }
  });

  it("テーマは DASHBOARD_THEMES のどれかである", () => {
    const picked = pickDashboardTheme("any-user");
    expect(DASHBOARD_THEMES).toContainEqual(picked);
  });

  it("userId が空文字列や null/undefined でも落ちず、先頭テーマを返す", () => {
    expect(pickDashboardTheme("")).toEqual(DASHBOARD_THEMES[0]);
    expect(pickDashboardTheme(null)).toEqual(DASHBOARD_THEMES[0]);
    expect(pickDashboardTheme(undefined)).toEqual(DASHBOARD_THEMES[0]);
  });

  it("異なる userId は（少なくとも 2 種類以上の）テーマに分散する", () => {
    const ids = [
      "u1",
      "u2",
      "u3",
      "u4",
      "u5",
      "abc",
      "xyz",
      "long-user-id-000",
      "clxxxxxxxxxx0001",
      "clxxxxxxxxxx0002",
    ];
    const results = new Set(ids.map((id) => pickDashboardTheme(id).title));
    expect(results.size).toBeGreaterThan(1);
  });

  it("DASHBOARD_THEMES は既存の 9 テーマを保持している", () => {
    expect(DASHBOARD_THEMES.length).toBe(9);
    expect(DASHBOARD_THEMES[0].title).toBe("新着の店舗");
    expect(DASHBOARD_THEMES.map((t) => t.title)).toContain("新宿エリアの店舗");
  });
});
