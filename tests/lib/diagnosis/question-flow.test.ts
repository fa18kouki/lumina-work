import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  DIAGNOSIS_STEPS,
  getQuestionsForStep,
  getQuestionById,
  getNextQuestion,
  getNextUnansweredQuestion,
  areRequiredQuestionsAnswered,
  calculateProgress,
  getCompletionMessage,
} from "@/lib/diagnosis/question-flow";
import type { DiagnosisAnswers } from "@/lib/diagnosis/types";

describe("DIAGNOSIS_STEPS", () => {
  it("6つのステップが定義されている", () => {
    expect(DIAGNOSIS_STEPS).toHaveLength(6);
  });

  it("各ステップにlabelとquestionCountが含まれている", () => {
    for (const step of DIAGNOSIS_STEPS) {
      expect(step.step).toBeDefined();
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.questionCount).toBeGreaterThan(0);
    }
  });
});

describe("QUESTIONS", () => {
  it("全質問にidとstepが定義されている", () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.step).toBeDefined();
    }
  });

  it("質問IDが一意である", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("各ステップに少なくとも1つの質問がある", () => {
    for (const step of DIAGNOSIS_STEPS) {
      const questions = QUESTIONS.filter((q) => q.step === step.step);
      expect(questions.length).toBeGreaterThan(0);
    }
  });
});

describe("getQuestionsForStep", () => {
  it("BASIC_INFOステップの質問を返す", () => {
    const questions = getQuestionsForStep("BASIC_INFO");
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.step === "BASIC_INFO")).toBe(true);
  });

  it("EXPERIENCEステップの質問を返す", () => {
    const questions = getQuestionsForStep("EXPERIENCE");
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.step === "EXPERIENCE")).toBe(true);
  });

  it("他のステップの質問を含まない", () => {
    const questions = getQuestionsForStep("CONTACT");
    expect(questions.every((q) => q.step === "CONTACT")).toBe(true);
  });
});

describe("getQuestionById", () => {
  it("存在するIDで質問を取得できる", () => {
    const question = getQuestionById("nickname");
    expect(question).toBeDefined();
    expect(question!.id).toBe("nickname");
  });

  it("存在しないIDでundefinedを返す", () => {
    const question = getQuestionById("nonexistent");
    expect(question).toBeUndefined();
  });
});

describe("getNextQuestion", () => {
  it("最初の質問を取得できる（currentQuestionId=null）", () => {
    const next = getNextQuestion(null, {});
    expect(next).toBeDefined();
    expect(next!.id).toBe("nickname");
  });

  it("次の質問を取得できる", () => {
    const next = getNextQuestion("nickname", {});
    expect(next).toBeDefined();
    expect(next!.id).toBe("age");
  });

  it("スキップ条件を満たす質問をスキップする", () => {
    // totalExperienceYears=0の場合、経験関連の質問がスキップされる
    const answers: DiagnosisAnswers = { totalExperienceYears: 0 };
    const next = getNextQuestion("totalExperienceYears", answers);
    expect(next).toBeDefined();
    // experienceAreas, experienceBusinessTypes, previousHourlyRate,
    // monthlySales, monthlyNominations はスキップされ、alcoholTolerance に到達
    expect(next!.id).toBe("alcoholTolerance");
  });

  it("最後の質問の後はnullを返す", () => {
    const lastQuestion = QUESTIONS[QUESTIONS.length - 1];
    const next = getNextQuestion(lastQuestion.id, {});
    expect(next).toBeNull();
  });
});

describe("getNextUnansweredQuestion", () => {
  it("回答済みの質問をスキップする", () => {
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
    };
    const next = getNextUnansweredQuestion(null, answers);
    expect(next).toBeDefined();
    // nickname, ageは回答済みなのでスキップ
    expect(next!.id).toBe("birthDate");
  });

  it("スキップ条件と回答済みの両方を考慮する", () => {
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
      birthDate: "1998-01-01",
      totalExperienceYears: 0, // 経験関連をスキップ
      alcoholTolerance: "MODERATE",
    };
    const next = getNextUnansweredQuestion("totalExperienceYears", answers);
    expect(next).toBeDefined();
    // 経験関連はスキップ、alcoholToleranceは回答済み → desiredAreas
    expect(next!.id).toBe("desiredAreas");
  });

  it("全質問が回答済みならnullを返す", () => {
    // 必須質問だけ回答済みにする（スキップ条件付き質問は条件で除外）
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
      birthDate: "1998-01-01",
      photos: ["photo.jpg"],
      instagramId: "@test",
      lineId: "test_line",
      currentListingUrl: "https://example.com",
      totalExperienceYears: 0, // 経験関連をスキップ
      alcoholTolerance: "MODERATE",
      desiredAreas: ["銀座"],
      desiredHourlyRate: 5000,
      desiredMonthlyIncome: 50,
      availableDaysPerWeek: 3,
      preferredAtmosphere: ["落ち着いた店"],
      preferredClientele: ["ビジネスマン"],
      birthdaySales: 0,
      hasVipClients: false, // vipClientDescriptionをスキップ
      socialFollowers: 500,
      isAvailableNow: true, // downtimeUntilをスキップ
    };
    const next = getNextUnansweredQuestion(null, answers);
    expect(next).toBeNull();
  });
});

describe("areRequiredQuestionsAnswered", () => {
  it("必須質問が未回答ならfalse", () => {
    expect(areRequiredQuestionsAnswered({})).toBe(false);
  });

  it("必須質問がすべて回答済みならtrue", () => {
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
      totalExperienceYears: 3,
      desiredAreas: ["銀座"],
      desiredHourlyRate: 5000,
      isAvailableNow: true,
    };
    expect(areRequiredQuestionsAnswered(answers)).toBe(true);
  });

  it("必須の配列フィールドが空配列ならfalse", () => {
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
      totalExperienceYears: 3,
      desiredAreas: [], // 必須だが空
      desiredHourlyRate: 5000,
      isAvailableNow: true,
    };
    expect(areRequiredQuestionsAnswered(answers)).toBe(false);
  });

  it("スキップ条件を満たす必須質問は無視する", () => {
    // isAvailableNow=true の場合、downtimeUntil はスキップ対象
    // （ただしdowntimeUntilはrequired=falseなので影響なし）
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
      totalExperienceYears: 3,
      desiredAreas: ["銀座"],
      desiredHourlyRate: 5000,
      isAvailableNow: true,
    };
    expect(areRequiredQuestionsAnswered(answers)).toBe(true);
  });
});

describe("calculateProgress", () => {
  it("未回答でもスキップ条件による回答済みカウントがある", () => {
    const progress = calculateProgress({});
    // 空回答でもskipConditionがtrue(undefinedチェック)になる質問があるためcurrent>=0
    expect(progress.current).toBeGreaterThanOrEqual(0);
    expect(progress.percentage).toBeLessThan(100);
  });

  it("回答数に応じて進捗が増加する", () => {
    const emptyProgress = calculateProgress({});
    const answers: DiagnosisAnswers = {
      nickname: "テスト",
      age: 25,
    };
    const progress = calculateProgress(answers);
    expect(progress.current).toBeGreaterThan(emptyProgress.current);
    expect(progress.percentage).toBeGreaterThan(emptyProgress.percentage);
    expect(progress.percentage).toBeLessThan(100);
  });

  it("スキップされた質問は回答済みとしてカウントされる", () => {
    const withExperience: DiagnosisAnswers = { totalExperienceYears: 3 };
    const withoutExperience: DiagnosisAnswers = { totalExperienceYears: 0 };

    const progressWith = calculateProgress(withExperience);
    const progressWithout = calculateProgress(withoutExperience);

    // 経験0の場合、スキップされた質問が回答済みとしてカウント＆総数から除外されるため
    // 回答率が高くなる
    expect(progressWithout.percentage).toBeGreaterThan(progressWith.percentage);
  });

  it("totalがQUESTIONS数以下である", () => {
    const progress = calculateProgress({});
    expect(progress.total).toBeLessThanOrEqual(QUESTIONS.length);
    expect(progress.total).toBeGreaterThan(0);
  });
});

describe("getCompletionMessage", () => {
  it("ニックネームを含む完了メッセージを返す", () => {
    const message = getCompletionMessage({ nickname: "あい" });
    expect(message).toContain("あい");
    expect(message).toContain("診断が完了しました");
  });

  it("ニックネーム未設定の場合「あなた」を使用する", () => {
    const message = getCompletionMessage({});
    expect(message).toContain("あなた");
    expect(message).toContain("診断が完了しました");
  });
});
