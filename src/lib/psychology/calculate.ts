import { QUESTIONS, STYLE_TYPES, type Scores } from "./question-data";

export interface PsychologyAnswer {
  questionIndex: number;
  choiceIndex: number;
}

export interface PsychologyResult {
  typeName: string;
  description: string;
  strengths: string[];
  advice: string;
  scores: Scores;
}

export function calculatePsychology(answers: PsychologyAnswer[]): PsychologyResult {
  // 4軸の生スコアを集計
  const rawScores: Scores = { charm: 0, intellect: 0, warmth: 0, energy: 0 };

  for (const answer of answers) {
    const question = QUESTIONS[answer.questionIndex];
    const choice = question.choices[answer.choiceIndex];
    rawScores.charm += choice.scores.charm;
    rawScores.intellect += choice.scores.intellect;
    rawScores.warmth += choice.scores.warmth;
    rawScores.energy += choice.scores.energy;
  }

  // 0-100 に正規化（最大スコア = 3 × 6問 = 18）
  const maxPossible = 18;
  const maxRaw = Math.max(rawScores.charm, rawScores.intellect, rawScores.warmth, rawScores.energy, 1);
  const scaleFactor = 100 / maxRaw;

  const normalizedScores: Scores = {
    charm: Math.round(rawScores.charm * scaleFactor),
    intellect: Math.round(rawScores.intellect * scaleFactor),
    warmth: Math.round(rawScores.warmth * scaleFactor),
    energy: Math.round(rawScores.energy * scaleFactor),
  };

  // タイプ判定
  const styleType = determineType(rawScores);

  return {
    typeName: styleType.name,
    description: styleType.description,
    strengths: styleType.strengths,
    advice: styleType.advice,
    scores: normalizedScores,
  };
}

function determineType(scores: Scores) {
  // 複合タイプの判定（閾値: 各軸の最大可能スコアの50%以上）
  const threshold = 9; // 18 * 0.5

  // charm + warmth 両方高い → プリンセスタイプ
  if (scores.charm >= threshold && scores.warmth >= threshold) {
    return STYLE_TYPES.find((t) => t.id === "princess")!;
  }

  // intellect + energy 両方高い → お姉さんタイプ
  if (scores.intellect >= threshold && scores.energy >= threshold) {
    return STYLE_TYPES.find((t) => t.id === "bigsis")!;
  }

  // 単一軸タイプの判定（同点時: charm > warmth > energy > intellect）
  type Axis = keyof Scores;
  const axes: Axis[] = ["charm", "warmth", "energy", "intellect"];
  const maxScore = Math.max(...axes.map((a) => scores[a]));
  const topAxis = axes.find((a) => scores[a] === maxScore)!;

  const axisToType: Record<Axis, string> = {
    charm: "charisma",
    intellect: "muse",
    warmth: "madonna",
    energy: "entertainer",
  };

  return STYLE_TYPES.find((t) => t.id === axisToType[topAxis])!;
}
