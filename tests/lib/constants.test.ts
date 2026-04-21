import { describe, it, expect } from "vitest";
import {
  getOfferLimitForPlan,
  isProPlan,
  generateReferralCode,
  REFERRAL_CONFIG,
  SUBSCRIPTION_PLANS,
  BUSINESS_TYPES,
} from "@/lib/constants";

describe("getOfferLimitForPlan", () => {
  it("FREEプランは3件制限", () => {
    expect(getOfferLimitForPlan("FREE")).toBe(3);
  });

  it("CASUALプランは10件制限", () => {
    expect(getOfferLimitForPlan("CASUAL")).toBe(10);
  });

  it("PRO_TRIALプランは無制限（null）", () => {
    expect(getOfferLimitForPlan("PRO_TRIAL")).toBeNull();
  });

  it("PRO_BUSINESSプランは無制限（null）", () => {
    expect(getOfferLimitForPlan("PRO_BUSINESS")).toBeNull();
  });

  it("PRO_ENTERPRISEプランは無制限（null）", () => {
    expect(getOfferLimitForPlan("PRO_ENTERPRISE")).toBeNull();
  });
});

describe("isProPlan", () => {
  it("FREEはプロプランでない", () => {
    expect(isProPlan("FREE")).toBe(false);
  });

  it("CASUALはプロプランでない", () => {
    expect(isProPlan("CASUAL")).toBe(false);
  });

  it("PRO_TRIALはプロプラン", () => {
    expect(isProPlan("PRO_TRIAL")).toBe(true);
  });

  it("PRO_BUSINESSはプロプラン", () => {
    expect(isProPlan("PRO_BUSINESS")).toBe(true);
  });

  it("PRO_ENTERPRISEはプロプラン", () => {
    expect(isProPlan("PRO_ENTERPRISE")).toBe(true);
  });
});

describe("generateReferralCode", () => {
  it("プレフィックス付きのコードを生成する", () => {
    const code = generateReferralCode();
    expect(code.startsWith(REFERRAL_CONFIG.codePrefix)).toBe(true);
  });

  it("正しい長さのコードを生成する", () => {
    const code = generateReferralCode();
    const suffix = code.slice(REFERRAL_CONFIG.codePrefix.length);
    expect(suffix).toHaveLength(REFERRAL_CONFIG.codeLength);
  });

  it("紛らわしい文字（0, 1, I, O）を含まない", () => {
    // 100回生成して確認
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      const suffix = code.slice(REFERRAL_CONFIG.codePrefix.length);
      expect(suffix).not.toMatch(/[01IO]/);
    }
  });

  it("英大文字と数字のみで構成される", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      const suffix = code.slice(REFERRAL_CONFIG.codePrefix.length);
      expect(suffix).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("毎回異なるコードを生成する（ユニーク性）", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateReferralCode());
    }
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("SUBSCRIPTION_PLANS", () => {
  it("5つのプランが定義されている", () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(5);
  });

  it("各プランに必須フィールドが含まれている", () => {
    for (const plan of SUBSCRIPTION_PLANS) {
      expect(plan.id).toBeDefined();
      expect(plan.name).toBeDefined();
      expect(plan.pricePerStore).toBeGreaterThanOrEqual(0);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("推奨プランが1つだけ存在する", () => {
    const recommended = SUBSCRIPTION_PLANS.filter(
      (p) => "recommended" in p && p.recommended
    );
    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe("PRO_TRIAL");
  });
});

describe("BUSINESS_TYPES", () => {
  it("6つの業種が定義されている", () => {
    expect(BUSINESS_TYPES).toHaveLength(6);
  });

  it("各業種にvalueとlabelが含まれている", () => {
    for (const type of BUSINESS_TYPES) {
      expect(type.value).toBeDefined();
      expect(type.label).toBeDefined();
    }
  });
});
