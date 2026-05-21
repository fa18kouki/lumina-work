import { describe, it, expect } from "vitest";
import {
  SUBSCRIPTION_PLANS,
  VISIBLE_SUBSCRIPTION_PLANS,
  isSelfServeCheckoutAllowed,
} from "@/lib/constants";

describe("SUBSCRIPTION_PLANS invariant", () => {
  it("可視 + 非 FREE のプランは必ず ctaType=contact になっている", () => {
    const violations = VISIBLE_SUBSCRIPTION_PLANS.filter(
      (p) => p.id !== "FREE" && p.ctaType !== "contact",
    );
    expect(violations).toEqual([]);
  });

  it("FREE プランの定義はちゃんと存在し、ctaType は contact ではない", () => {
    const free = SUBSCRIPTION_PLANS.find((p) => p.id === "FREE");
    expect(free).toBeDefined();
    // FREE は無料なので問い合わせは不要
    expect(free?.ctaType).not.toBe("contact");
  });
});

describe("isSelfServeCheckoutAllowed", () => {
  it("FREE は self-serve 不可 (無料なので意味がない)", () => {
    expect(isSelfServeCheckoutAllowed("FREE")).toBe(false);
  });

  it("contact プラン (PRO_TRIAL) は self-serve 不可", () => {
    expect(isSelfServeCheckoutAllowed("PRO_TRIAL")).toBe(false);
  });

  it("checkout 型の隠しプラン (CASUAL) は self-serve 可 (legacy / 内部用)", () => {
    expect(isSelfServeCheckoutAllowed("CASUAL")).toBe(true);
  });

  it("checkout 型の隠しプラン (PRO_BUSINESS / PRO_ENTERPRISE) も同様", () => {
    expect(isSelfServeCheckoutAllowed("PRO_BUSINESS")).toBe(true);
    expect(isSelfServeCheckoutAllowed("PRO_ENTERPRISE")).toBe(true);
  });
});
