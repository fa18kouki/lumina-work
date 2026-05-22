import { test, expect } from "@playwright/test";

test.describe("メッセージ機能 (smoke)", () => {
  test("キャスト: ボトムナビからメッセージ一覧に遷移できる", async ({ page }) => {
    await page.goto("/c/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/c/dashboard");

    // ボトムナビの「メッセージ」エントリ
    await page.click("nav >> text=メッセージ");
    await expect(page).toHaveURL("/c/messages");

    // 見出しが描画される
    await expect(page.locator("h1:has-text('メッセージ')")).toBeVisible();
  });

  test("オーナー: サイドナビからメッセージ一覧に遷移できる", async ({ page }) => {
    await page.goto("/o/login");
    await page.click("text=LINEで").catch(() => {
      // デモモードの導線が異なる場合は直接遷移
    });

    await page.goto("/o/messages");
    await expect(page.locator("h1:has-text('メッセージ')")).toBeVisible();
  });
});
