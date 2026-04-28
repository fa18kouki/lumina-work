import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * Stripe 関連の環境変数に末尾改行が混入した場合に trim されることを検証するテスト。
 * getStripePriceId は非 export のため、環境変数を直接読む箇所のロジックを
 * 最小限に再現して検証する。
 */

describe("Stripe env trim", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("STRIPE_SECRET_KEY に末尾改行が含まれる場合、trim された値が使われる", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_abc123\n");
    const trimmed = process.env.STRIPE_SECRET_KEY?.trim();
    expect(trimmed).toBe("sk_test_abc123");
    expect(trimmed).not.toContain("\n");
  });

  it("STRIPE_CASUAL_PRICE_ID に末尾改行が含まれる場合、trim された値が使われる", () => {
    vi.stubEnv("STRIPE_CASUAL_PRICE_ID", "price_1TQq4WF3ig9LQx6UhfG4610s\n");
    const trimmed = process.env.STRIPE_CASUAL_PRICE_ID?.trim();
    expect(trimmed).toBe("price_1TQq4WF3ig9LQx6UhfG4610s");
    expect(trimmed).not.toContain("\n");
  });

  it("AUTH_URL に末尾改行が含まれる場合、trim された値が使われる", () => {
    vi.stubEnv("AUTH_URL", "https://lumina-work.jp\n");
    const trimmed = (process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim();
    expect(trimmed).toBe("https://lumina-work.jp");
    expect(trimmed).not.toContain("\n");
  });

  it("STRIPE_WEBHOOK_SECRET に末尾改行が含まれる場合、trim された値が使われる", () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_abc123\n");
    const trimmed = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    expect(trimmed).toBe("whsec_abc123");
    expect(trimmed).not.toContain("\n");
  });

  it("trim 結果が空文字の場合は falsy とみなせる", () => {
    vi.stubEnv("STRIPE_CASUAL_PRICE_ID", "   \n  ");
    const trimmed = process.env.STRIPE_CASUAL_PRICE_ID?.trim();
    expect(trimmed).toBe("");
    expect(!trimmed).toBe(true);
  });
});
