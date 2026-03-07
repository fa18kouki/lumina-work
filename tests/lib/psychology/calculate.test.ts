import { describe, it, expect } from "vitest";
import {
  calculatePsychology,
  type PsychologyAnswer,
  type PsychologyResult,
} from "@/lib/psychology/calculate";
import { QUESTIONS, STYLE_TYPES } from "@/lib/psychology/question-data";

describe("QUESTIONS", () => {
  it("6問ある", () => {
    expect(QUESTIONS).toHaveLength(6);
  });

  it("各質問に4つの選択肢がある", () => {
    for (const q of QUESTIONS) {
      expect(q.choices).toHaveLength(4);
    }
  });

  it("各選択肢にcharm/intellect/warmth/energyのスコアがある", () => {
    for (const q of QUESTIONS) {
      for (const choice of q.choices) {
        expect(choice.scores).toHaveProperty("charm");
        expect(choice.scores).toHaveProperty("intellect");
        expect(choice.scores).toHaveProperty("warmth");
        expect(choice.scores).toHaveProperty("energy");
      }
    }
  });

  it("各選択肢のスコアは0-3の範囲", () => {
    for (const q of QUESTIONS) {
      for (const choice of q.choices) {
        for (const value of Object.values(choice.scores)) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});

describe("STYLE_TYPES", () => {
  it("6つのタイプがある", () => {
    expect(STYLE_TYPES).toHaveLength(6);
  });

  it("各タイプにname, description, strengths, adviceがある", () => {
    for (const t of STYLE_TYPES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.strengths.length).toBeGreaterThan(0);
      expect(t.advice.length).toBeGreaterThan(0);
    }
  });
});

describe("calculatePsychology", () => {
  const makeAnswers = (pattern: number[]): PsychologyAnswer[] =>
    pattern.map((choiceIndex, questionIndex) => ({
      questionIndex,
      choiceIndex,
    }));

  it("6問分の回答からPsychologyResultを返す", () => {
    const answers = makeAnswers([0, 0, 0, 0, 0, 0]);
    const result: PsychologyResult = calculatePsychology(answers);
    expect(result).toHaveProperty("typeName");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("advice");
    expect(result).toHaveProperty("scores");
  });

  it("scoresは0-100に正規化された4軸を含む", () => {
    const answers = makeAnswers([0, 1, 2, 3, 0, 1]);
    const result = calculatePsychology(answers);
    for (const key of ["charm", "intellect", "warmth", "energy"] as const) {
      expect(result.scores[key]).toBeGreaterThanOrEqual(0);
      expect(result.scores[key]).toBeLessThanOrEqual(100);
    }
  });

  it("タイプ名が6タイプのいずれかである", () => {
    const validTypeNames = STYLE_TYPES.map((t) => t.name);
    const answers = makeAnswers([0, 0, 0, 0, 0, 0]);
    const result = calculatePsychology(answers);
    expect(validTypeNames).toContain(result.typeName);
  });

  it("異なる回答パターンで異なるタイプが出る可能性がある", () => {
    const typeNames = new Set<string>();
    const patterns = [
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3],
      [0, 1, 2, 3, 0, 1],
      [3, 2, 1, 0, 3, 2],
    ];
    for (const p of patterns) {
      const result = calculatePsychology(makeAnswers(p));
      typeNames.add(result.typeName);
    }
    expect(typeNames.size).toBeGreaterThan(1);
  });

  it("charm高得点で魅惑のカリスマタイプ判定", () => {
    // charm=3の選択肢を全問で選ぶパターンを探す
    const charmAnswers: PsychologyAnswer[] = QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce(
        (best, c, i) => (c.scores.charm > q.choices[best].scores.charm ? i : best),
        0
      );
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculatePsychology(charmAnswers);
    // charm系のタイプ（魅惑のカリスマ or 甘え上手なプリンセス）
    expect(["魅惑のカリスマ", "甘え上手なプリンセス"]).toContain(result.typeName);
  });

  it("warmth高得点で癒し系マドンナタイプ判定", () => {
    const warmthAnswers: PsychologyAnswer[] = QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce(
        (best, c, i) => (c.scores.warmth > q.choices[best].scores.warmth ? i : best),
        0
      );
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculatePsychology(warmthAnswers);
    expect(["癒し系マドンナ", "甘え上手なプリンセス"]).toContain(result.typeName);
  });

  it("intellect高得点で知的ミューズタイプ判定", () => {
    const intellectAnswers: PsychologyAnswer[] = QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce(
        (best, c, i) => (c.scores.intellect > q.choices[best].scores.intellect ? i : best),
        0
      );
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculatePsychology(intellectAnswers);
    expect(["知的ミューズ", "頼れるお姉さん"]).toContain(result.typeName);
  });

  it("energy高得点で華やかエンターテイナータイプ判定", () => {
    const energyAnswers: PsychologyAnswer[] = QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce(
        (best, c, i) => (c.scores.energy > q.choices[best].scores.energy ? i : best),
        0
      );
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculatePsychology(energyAnswers);
    expect(["華やかエンターテイナー", "頼れるお姉さん"]).toContain(result.typeName);
  });

  it("scoresの最大値が100になる", () => {
    // 全問同じ選択肢を選んだ場合、最も高い軸のスコアは100に正規化されるべき
    const answers = makeAnswers([0, 0, 0, 0, 0, 0]);
    const result = calculatePsychology(answers);
    const maxScore = Math.max(
      result.scores.charm,
      result.scores.intellect,
      result.scores.warmth,
      result.scores.energy
    );
    expect(maxScore).toBe(100);
  });
});
