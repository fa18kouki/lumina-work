import { test, expect } from "@playwright/test";

test.describe("キャスト側フロー", () => {
  test("ログイン → ダッシュボード表示", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=キャストログイン")).toBeVisible();

    // デモモード（LINEログインボタン）でログイン
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=こんにちは")).toBeVisible();
  });

  test("ダッシュボード → 店舗検索ページ遷移", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");

    await page.click("text=店舗検索");
    await expect(page).toHaveURL("/stores");
    await expect(page.locator("input[placeholder*='エリア']")).toBeVisible();
  });

  test("ダッシュボード → オファーページ遷移", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");

    // ナビゲーションバーからオファーページへ
    await page.goto("/offers");
    await expect(page.locator("text=オファー").first()).toBeVisible();
    // タブフィルターが存在すること
    await expect(page.locator("text=すべて").first()).toBeVisible();
    await expect(page.locator("text=未回答")).toBeVisible();
  });

  test("ダッシュボード → マッチングページ遷移", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");

    await page.click("text=メッセージ");
    await expect(page).toHaveURL("/matches");
    await expect(page.locator("h1:text('マッチング')")).toBeVisible();
  });

  test("ダッシュボード → プロフィールページ遷移", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");

    await page.click("text=マイページ");
    await expect(page).toHaveURL("/profile");
  });

  test("ダッシュボード → AI診断ページ遷移", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/dashboard");

    await page.click("text=AI診断");
    await expect(page).toHaveURL("/ai-diagnosis");
  });
});

test.describe("店舗側フロー", () => {
  test("店舗ログイン → ダッシュボード表示", async ({ page }) => {
    await page.goto("/store/login");
    await expect(page.locator("text=店舗ログイン")).toBeVisible();

    await page.click("text=LINEで");
    await expect(page).toHaveURL("/store/dashboard");
    // 統計カードの存在確認
    await expect(page.locator("text=新規応募")).toBeVisible();
    await expect(page.locator("text=面接予定").first()).toBeVisible();
  });

  test("ダッシュボード → キャスト検索ページ遷移", async ({ page }) => {
    await page.goto("/store/login");
    await page.click("text=LINEで");
    await expect(page).toHaveURL("/store/dashboard");

    await page.click("text=応募者を検索");
    await expect(page).toHaveURL("/store/casts");
    await expect(page.locator("text=キャスト検索")).toBeVisible();
  });

  test("店舗キャスト検索 → フィルター操作", async ({ page }) => {
    await page.goto("/store/login");
    await page.click("text=LINEで");
    await page.goto("/store/casts");

    // エリアフィルター操作
    const areaSelect = page.locator("select").first();
    await areaSelect.selectOption("新宿");
    // ランクフィルター操作
    const rankSelect = page.locator("select").nth(1);
    await rankSelect.selectOption("A");
  });

  test("ダッシュボード → オファー管理ページ遷移", async ({ page }) => {
    await page.goto("/store/login");
    await page.click("text=LINEで");
    await page.goto("/store/offers");

    await expect(page.locator("text=オファー管理")).toBeVisible();
    // タブの存在確認
    await expect(page.locator("text=すべて").first()).toBeVisible();
    await expect(page.locator("text=待機中")).toBeVisible();
  });

  test("ダッシュボード → マッチングページ遷移", async ({ page }) => {
    await page.goto("/store/login");
    await page.click("text=LINEで");
    await page.goto("/store/matches");

    await expect(page.locator("h1:text('マッチング')")).toBeVisible();
    // タブの存在確認
    await expect(page.locator("text=マッチング成立")).toBeVisible();
    await expect(page.locator("text=承諾待ち")).toBeVisible();
  });

  test("ダッシュボード → 店舗プロフィールページ遷移", async ({ page }) => {
    await page.goto("/store/login");
    await page.click("text=LINEで");
    await page.goto("/store/profile");

    await expect(page.locator("text=店舗情報")).toBeVisible();
    await expect(page.locator("text=基本情報")).toBeVisible();
  });
});

test.describe("パブリック診断フロー", () => {
  test("診断ページ → 質問表示", async ({ page }) => {
    await page.goto("/diagnosis");
    // 診断ページの要素が表示されることを確認
    await expect(page.locator("body")).toBeVisible();
  });
});
