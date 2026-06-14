import { describe, expect, it } from "vitest";
import { toPickupStoreCardModel } from "@/components/lp/PickupStores";

describe("toPickupStoreCardModel", () => {
  it("公開店舗データをLP表示用カードに整形する", () => {
    const card = toPickupStoreCardModel({
      id: "store_1",
      name: "LUMINA 錦三店",
      area: "錦三丁目",
      description: "落ち着いた客層のお店です",
      photos: ["https://example.com/photo.jpg"],
      bannerUrl: "https://example.com/banner.jpg",
      logoUrl: null,
      storeType: "LOUNGE",
      nearestStation: "栄駅",
      walkMinutes: 3,
      salarySystem: { hourlyRateMin: 7000, hourlyRateMax: 12000 },
      benefits: ["日払いOK", "送迎あり"],
      businessHours: "20:00〜LAST",
      regularHolidays: null,
      hasTransportation: true,
      hasDormitory: false,
      hasDressRental: true,
      hasHairMakeup: true,
      hasQuota: false,
      drinkingRequired: false,
      dailyPayType: "PARTIAL",
      hasNursery: false,
      atmosphereTags: ["落ち着いた雰囲気"],
      signingBonus: null,
      trialShiftInfo: null,
    });

    expect(card).toEqual({
      id: "store_1",
      name: "LUMINA 錦三店",
      area: "錦三丁目",
      access: "栄駅 徒歩3分",
      storeType: "ラウンジ",
      tab: "ラウンジ",
      tags: ["日払いOK", "送迎あり"],
      hourlyRate: 7000,
      image: "https://example.com/banner.jpg",
    });
  });

  it("画像や時給が未入力でもLPで壊れない既定値にする", () => {
    const card = toPickupStoreCardModel({
      id: "store_2",
      name: "新着店舗",
      area: "名古屋",
      description: null,
      photos: [],
      bannerUrl: null,
      logoUrl: null,
      storeType: null,
      nearestStation: null,
      walkMinutes: null,
      salarySystem: null,
      benefits: [],
      businessHours: null,
      regularHolidays: null,
      hasTransportation: false,
      hasDormitory: false,
      hasDressRental: false,
      hasHairMakeup: false,
      hasQuota: true,
      drinkingRequired: true,
      dailyPayType: "NONE",
      hasNursery: false,
      atmosphereTags: [],
      signingBonus: null,
      trialShiftInfo: null,
    });

    expect(card.image).toBe("/champagne-night-view.png");
    expect(card.hourlyRate).toBeNull();
    expect(card.storeType).toBe("掲載店舗");
    expect(card.tab).toBe("その他");
  });
});
