import { describe, it, expect } from "vitest";
import {
  calculateTypeDiagnosis,
  type DiagnosisAnswer,
  type DiagnosisResult,
} from "@/lib/type-diagnosis/calculate";
import { DIAGNOSIS_QUESTIONS, CHARACTER_TYPES } from "@/lib/type-diagnosis/diagnosis-data";

describe("DIAGNOSIS_QUESTIONS", () => {
  it("8問ある", () => {
    expect(DIAGNOSIS_QUESTIONS).toHaveLength(8);
  });

  it("各質問に選択肢がある（2択または4択）", () => {
    for (const q of DIAGNOSIS_QUESTIONS) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.choices.length).toBeLessThanOrEqual(4);
    }
  });

  it("各選択肢にx,yスコアがある", () => {
    for (const q of DIAGNOSIS_QUESTIONS) {
      for (const choice of q.choices) {
        expect(choice.scores).toHaveProperty("x");
        expect(choice.scores).toHaveProperty("y");
      }
    }
  });

  it("各選択肢のスコアは-2〜+2の範囲", () => {
    for (const q of DIAGNOSIS_QUESTIONS) {
      for (const choice of q.choices) {
        expect(choice.scores.x).toBeGreaterThanOrEqual(-2);
        expect(choice.scores.x).toBeLessThanOrEqual(2);
        expect(choice.scores.y).toBeGreaterThanOrEqual(-2);
        expect(choice.scores.y).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("CHARACTER_TYPES", () => {
  it("8つのタイプがある", () => {
    expect(CHARACTER_TYPES).toHaveLength(8);
  });

  it("各タイプにname, description, impression, specialMoveがある", () => {
    for (const t of CHARACTER_TYPES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.impression.length).toBeGreaterThan(0);
      expect(t.specialMove.length).toBeGreaterThan(0);
    }
  });
});

describe("calculateTypeDiagnosis", () => {
  const makeAnswers = (pattern: number[]): DiagnosisAnswer[] =>
    pattern.map((choiceIndex, questionIndex) => ({
      questionIndex,
      choiceIndex,
    }));

  it("8問分の回答からDiagnosisResultを返す", () => {
    const answers = makeAnswers([0, 0, 0, 0, 0, 0, 0, 0]);
    const result: DiagnosisResult = calculateTypeDiagnosis(answers);
    expect(result).toHaveProperty("typeName");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("impression");
    expect(result).toHaveProperty("specialMove");
    expect(result).toHaveProperty("secondaryType");
    expect(result).toHaveProperty("coordinates");
  });

  it("coordinatesは-100〜+100の範囲に正規化されたx,yを含む", () => {
    const answers = makeAnswers([0, 1, 0, 1, 0, 1, 0, 1]);
    const result = calculateTypeDiagnosis(answers);
    expect(result.coordinates.x).toBeGreaterThanOrEqual(-100);
    expect(result.coordinates.x).toBeLessThanOrEqual(100);
    expect(result.coordinates.y).toBeGreaterThanOrEqual(-100);
    expect(result.coordinates.y).toBeLessThanOrEqual(100);
  });

  it("タイプ名が8タイプのいずれかである", () => {
    const validTypeNames = CHARACTER_TYPES.map((t) => t.name);
    const answers = makeAnswers([0, 0, 0, 0, 0, 0, 0, 0]);
    const result = calculateTypeDiagnosis(answers);
    expect(validTypeNames).toContain(result.typeName);
  });

  it("secondaryTypeがprimaryと異なる", () => {
    const answers = makeAnswers([0, 1, 0, 1, 0, 1, 0, 1]);
    const result = calculateTypeDiagnosis(answers);
    expect(result.secondaryType).not.toBe(result.typeName);
  });

  it("secondaryTypeが8タイプのいずれかである", () => {
    const validTypeNames = CHARACTER_TYPES.map((t) => t.name);
    const answers = makeAnswers([0, 0, 0, 0, 0, 0, 0, 0]);
    const result = calculateTypeDiagnosis(answers);
    expect(validTypeNames).toContain(result.secondaryType);
  });

  it("異なる回答パターンで異なるタイプが出る可能性がある", () => {
    const typeNames = new Set<string>();
    const patterns = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
    ];
    for (const p of patterns) {
      const result = calculateTypeDiagnosis(makeAnswers(p));
      typeNames.add(result.typeName);
    }
    expect(typeNames.size).toBeGreaterThan(1);
  });

  it("cute+active方向の回答で小悪魔キュートタイプ", () => {
    // x>0(cute), y>0(active) の選択肢を選ぶ
    const answers: DiagnosisAnswer[] = DIAGNOSIS_QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce((best, c, i) => {
        const current = c.scores.x + c.scores.y;
        const bestScore = q.choices[best].scores.x + q.choices[best].scores.y;
        return current > bestScore ? i : best;
      }, 0);
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculateTypeDiagnosis(answers);
    // cute+active系のタイプ
    expect(["小悪魔キュート", "アイドル系", "パーティーガール"]).toContain(result.typeName);
  });

  it("cool+mysterious方向の回答でクールビューティータイプ", () => {
    // x<0(cool), y<0(mysterious) の選択肢を選ぶ
    const answers: DiagnosisAnswer[] = DIAGNOSIS_QUESTIONS.map((q, qi) => {
      const bestIdx = q.choices.reduce((best, c, i) => {
        const current = -c.scores.x - c.scores.y; // cool and mysterious
        const bestScore = -q.choices[best].scores.x - q.choices[best].scores.y;
        return current > bestScore ? i : best;
      }, 0);
      return { questionIndex: qi, choiceIndex: bestIdx };
    });
    const result = calculateTypeDiagnosis(answers);
    expect(["クールビューティー", "大人セクシー", "ミステリアスクイーン"]).toContain(result.typeName);
  });

  it("coordinatesの整数値を返す", () => {
    const answers = makeAnswers([0, 0, 0, 0, 0, 0, 0, 0]);
    const result = calculateTypeDiagnosis(answers);
    expect(Number.isInteger(result.coordinates.x)).toBe(true);
    expect(Number.isInteger(result.coordinates.y)).toBe(true);
  });
});
