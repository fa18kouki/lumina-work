import type { SalarySystem, TrialShiftInfo, WorkConditions, SnsLinks } from "@/lib/types/store";
import type { BusinessType, DailyPayType } from "@/lib/constants";

export interface StoreProfileFormData {
  // 基本情報
  name: string;
  storeType: BusinessType | null;
  area: string;
  address: string;
  nearestStation: string;
  walkMinutes: number | null;
  description: string;
  businessHours: string;
  regularHolidays: string;
  // ビジュアル
  bannerUrl: string | null;
  logoUrl: string | null;
  // 給与
  salary: SalarySystem;
  dailyPayType: DailyPayType;
  signingBonus: number | null;
  // 体験入店
  trialShiftInfo: TrialShiftInfo | null;
  // 勤務条件
  workConditions: WorkConditions | null;
  hasQuota: boolean;
  drinkingRequired: boolean;
  // 福利厚生
  benefits: string[];
  hasTransportation: boolean;
  transportationDetails: string;
  hasDormitory: boolean;
  dormitoryDetails: string;
  hasDressRental: boolean;
  hasHairMakeup: boolean;
  hasNursery: boolean;
  hasPartnerSalon: boolean;
  partnerSalonDetails: string;
  // 店舗の魅力
  atmosphereTags: string[];
  castCount: number | null;
  clientele: string;
  staffIntroduction: string;
  photos: string[];
  // SNS
  snsLinks: SnsLinks | null;
}

export interface SectionProps {
  form: StoreProfileFormData;
  onUpdate: (partial: Partial<StoreProfileFormData>) => void;
}

export const defaultFormData: StoreProfileFormData = {
  name: "",
  storeType: null,
  area: "",
  address: "",
  nearestStation: "",
  walkMinutes: null,
  description: "",
  businessHours: "",
  regularHolidays: "",
  bannerUrl: null,
  logoUrl: null,
  salary: { hourlyRateMin: 3000, hourlyRateMax: 10000 },
  dailyPayType: "NONE",
  signingBonus: null,
  trialShiftInfo: null,
  workConditions: null,
  hasQuota: true,
  drinkingRequired: true,
  benefits: [],
  hasTransportation: false,
  transportationDetails: "",
  hasDormitory: false,
  dormitoryDetails: "",
  hasDressRental: false,
  hasHairMakeup: false,
  hasNursery: false,
  hasPartnerSalon: false,
  partnerSalonDetails: "",
  atmosphereTags: [],
  castCount: null,
  clientele: "",
  staffIntroduction: "",
  photos: [],
  snsLinks: null,
};
