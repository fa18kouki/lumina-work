/** 体験入店情報（Json型） */
export interface TrialShiftInfo {
  trialHourlyRate?: number;
  trialCount?: number;
  trialConditions?: string;
}

/** 勤務条件（Json型） */
export interface WorkConditions {
  minWorkDays?: number;
  minWorkHours?: number;
  lastTrainOk?: boolean;
  flexibleSchedule?: boolean;
}

/** SNSリンク（Json型） */
export interface SnsLinks {
  instagram?: string;
  twitter?: string;
}

/** 給与体系（Json型） */
export interface SalarySystem {
  hourlyRateMin: number;
  hourlyRateMax: number;
  companionBackMin?: number;
  companionBackMax?: number;
  drinkBackMin?: number;
  drinkBackMax?: number;
  nominationBackMin?: number;
  nominationBackMax?: number;
  floorNominationBackMin?: number;
  floorNominationBackMax?: number;
  salesBackMinPercent?: number;
  salesBackMaxPercent?: number;
}
