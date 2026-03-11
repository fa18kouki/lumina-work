import { describe, it, expect } from "vitest";
import {
  calculateProfileCompleteness,
  type CastProfileData,
} from "@/lib/profile-completeness";

function makeEmptyProfile(): CastProfileData {
  return {
    // カテゴリ1: 基本情報・連絡先
    fullName: null,
    furigana: null,
    gender: null,
    currentArea: null,
    permanentAddress: null,
    phoneNumber: null,
    bloodType: null,
    zodiacSign: null,
    email: null,
    pcEmail: null,
    instagramId: null,
    lineId: null,
    facebookId: null,
    twitterId: null,
    tiktokId: null,
    hobbies: null,
    specialSkills: null,
    emergencyContact: null,

    // カテゴリ2: 属性
    livingArrangement: null,
    transportation: null,
    needsPickup: null,
    hasTattoo: null,
    dressAvailability: null,
    hasBoyfriend: null,
    hasHusband: null,
    hasChildren: null,

    // カテゴリ3: キャリア・身体情報
    currentOccupation: null,
    height: null,
    weight: null,
    bust: null,
    waist: null,
    hip: null,
    cupSize: null,
    languageSkills: null,
    cosmeticSurgery: null,

    // カテゴリ4: 業務アンケート
    birthdayEventWillingness: null,
    photoPublicationConsent: null,
    familyApproval: null,

    // カテゴリ5: 希望条件
    desiredAreas: [],
    desiredHourlyRate: null,
    desiredMonthlyIncome: null,
    availableDaysPerWeek: null,
    shiftPreferences: null,
    motivation: null,
    storePreferences: null,
    guaranteedHourlyRate: null,

    // カテゴリ6: 職歴
    workHistories: [],
  };
}

describe("calculateProfileCompleteness", () => {
  it("空プロフィールで0%を返す", () => {
    const result = calculateProfileCompleteness(makeEmptyProfile());
    expect(result.totalPercent).toBe(0);
    expect(result.categories).toHaveLength(6);
    result.categories.forEach((cat) => {
      expect(cat.percent).toBe(0);
      expect(cat.filledCount).toBe(0);
    });
  });

  it("カテゴリ1のフィールドを埋めると基本情報の完了度が上がる", () => {
    const profile = makeEmptyProfile();
    profile.fullName = "山田花子";
    profile.furigana = "やまだはなこ";
    profile.gender = "female";
    profile.phoneNumber = "090-1234-5678";

    const result = calculateProfileCompleteness(profile);
    const cat1 = result.categories.find((c) => c.id === 1);
    expect(cat1).toBeDefined();
    expect(cat1!.filledCount).toBe(4);
    expect(cat1!.percent).toBeGreaterThan(0);
  });

  it("カテゴリ2のフィールドを全部埋めると属性100%", () => {
    const profile = makeEmptyProfile();
    profile.livingArrangement = "ALONE";
    profile.transportation = "TRAIN";
    profile.needsPickup = false;
    profile.hasTattoo = false;
    profile.dressAvailability = "OWNED";
    profile.hasBoyfriend = false;
    profile.hasHusband = false;
    profile.hasChildren = false;

    const result = calculateProfileCompleteness(profile);
    const cat2 = result.categories.find((c) => c.id === 2);
    expect(cat2!.percent).toBe(100);
    expect(cat2!.filledCount).toBe(cat2!.totalCount);
  });

  it("カテゴリ6は職歴が1件以上あれば100%", () => {
    const profile = makeEmptyProfile();
    profile.workHistories = [
      { storeName: "テスト店", hourlyRate: 3000 },
    ];

    const result = calculateProfileCompleteness(profile);
    const cat6 = result.categories.find((c) => c.id === 6);
    expect(cat6!.percent).toBe(100);
  });

  it("全フィールドを埋めると100%になる", () => {
    const profile = makeEmptyProfile();
    // カテゴリ1
    profile.fullName = "山田花子";
    profile.furigana = "やまだはなこ";
    profile.gender = "female";
    profile.currentArea = "roppongi";
    profile.permanentAddress = "東京都港区";
    profile.phoneNumber = "090-1234-5678";
    profile.bloodType = "A";
    profile.zodiacSign = "dragon";
    profile.email = "test@example.com";
    profile.pcEmail = "test@pc.com";
    profile.instagramId = "testinsta";
    profile.lineId = "testline";
    profile.facebookId = "testfb";
    profile.twitterId = "testx";
    profile.tiktokId = "testtiktok";
    profile.hobbies = "読書";
    profile.specialSkills = "英会話";
    profile.emergencyContact = { relation: "母", name: "山田太郎", address: "東京都" };

    // カテゴリ2
    profile.livingArrangement = "ALONE";
    profile.transportation = "TRAIN";
    profile.needsPickup = false;
    profile.hasTattoo = false;
    profile.dressAvailability = "OWNED";
    profile.hasBoyfriend = false;
    profile.hasHusband = false;
    profile.hasChildren = false;

    // カテゴリ3
    profile.currentOccupation = "学生";
    profile.height = 165;
    profile.weight = 50;
    profile.bust = 85;
    profile.waist = 58;
    profile.hip = 86;
    profile.cupSize = "C";
    profile.languageSkills = { english: "日常会話" };
    profile.cosmeticSurgery = "なし";

    // カテゴリ4
    profile.birthdayEventWillingness = true;
    profile.photoPublicationConsent = true;
    profile.familyApproval = true;

    // カテゴリ5
    profile.desiredAreas = ["roppongi"];
    profile.desiredHourlyRate = 5000;
    profile.desiredMonthlyIncome = 500000;
    profile.availableDaysPerWeek = 5;
    profile.shiftPreferences = { days: 5 };
    profile.motivation = "頑張ります";
    profile.storePreferences = "落ち着いた雰囲気";
    profile.guaranteedHourlyRate = 4000;

    // カテゴリ6
    profile.workHistories = [
      { storeName: "Club X", hourlyRate: 4000 },
    ];

    const result = calculateProfileCompleteness(profile);
    expect(result.totalPercent).toBe(100);
    result.categories.forEach((cat) => {
      expect(cat.percent).toBe(100);
    });
  });

  it("重み付けが正しく反映される", () => {
    // カテゴリ1（重み25%）のみ100%にした場合、totalPercentが25になる
    const profile = makeEmptyProfile();
    profile.fullName = "山田花子";
    profile.furigana = "やまだはなこ";
    profile.gender = "female";
    profile.currentArea = "roppongi";
    profile.permanentAddress = "東京都港区";
    profile.phoneNumber = "090-1234-5678";
    profile.bloodType = "A";
    profile.zodiacSign = "dragon";
    profile.email = "test@example.com";
    profile.pcEmail = "test@pc.com";
    profile.instagramId = "testinsta";
    profile.lineId = "testline";
    profile.facebookId = "testfb";
    profile.twitterId = "testx";
    profile.tiktokId = "testtiktok";
    profile.hobbies = "読書";
    profile.specialSkills = "英会話";
    profile.emergencyContact = { relation: "母", name: "山田太郎", address: "東京都" };

    const result = calculateProfileCompleteness(profile);
    expect(result.totalPercent).toBe(25);
  });

  it("boolean型のfalseはnullと区別して入力済みとみなす", () => {
    const profile = makeEmptyProfile();
    profile.needsPickup = false;
    profile.hasTattoo = false;

    const result = calculateProfileCompleteness(profile);
    const cat2 = result.categories.find((c) => c.id === 2);
    expect(cat2!.filledCount).toBe(2);
  });

  it("空配列のdesiredAreasは未入力とみなす", () => {
    const profile = makeEmptyProfile();
    profile.desiredAreas = [];

    const result = calculateProfileCompleteness(profile);
    const cat5 = result.categories.find((c) => c.id === 5);
    expect(cat5!.filledCount).toBe(0);
  });
});
