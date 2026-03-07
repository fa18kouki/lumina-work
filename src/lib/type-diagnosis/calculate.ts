import { DIAGNOSIS_QUESTIONS, CHARACTER_TYPES, type CharacterType } from "./diagnosis-data";

export interface DiagnosisAnswer {
  questionIndex: number;
  choiceIndex: number;
}

export interface DiagnosisResult {
  typeName: string;
  description: string;
  impression: string;
  specialMove: string;
  secondaryType: string;
  coordinates: { x: number; y: number };
}

// タイプごとの代表座標（判定用）
const TYPE_CENTERS: Record<string, { x: number; y: number }> = {
  koakuma: { x: 50, y: 50 },
  tennen: { x: 50, y: -50 },
  coolbeauty: { x: -50, y: -50 },
  dekiru: { x: -50, y: 50 },
  idol: { x: 100, y: 0 },
  sexy: { x: -100, y: 0 },
  partygirl: { x: 0, y: 100 },
  mysteriousqueen: { x: 0, y: -100 },
};

export function calculateTypeDiagnosis(answers: DiagnosisAnswer[]): DiagnosisResult {
  // XY生スコアを集計
  let rawX = 0;
  let rawY = 0;

  for (const answer of answers) {
    const question = DIAGNOSIS_QUESTIONS[answer.questionIndex];
    const choice = question.choices[answer.choiceIndex];
    rawX += choice.scores.x;
    rawY += choice.scores.y;
  }

  // -100〜+100 に正規化
  // 最大可能スコア: 各質問で最大±2、8問で最大±16
  const maxPossible = 16;
  const normalizedX = Math.round((rawX / maxPossible) * 100);
  const normalizedY = Math.round((rawY / maxPossible) * 100);

  const coordinates = {
    x: Math.max(-100, Math.min(100, normalizedX)),
    y: Math.max(-100, Math.min(100, normalizedY)),
  };

  // タイプ判定
  const primaryType = determineType(coordinates);
  const secondaryType = determineSecondaryType(coordinates, primaryType);

  return {
    typeName: primaryType.name,
    description: primaryType.description,
    impression: primaryType.impression,
    specialMove: primaryType.specialMove,
    secondaryType: secondaryType.name,
    coordinates,
  };
}

function determineType(coords: { x: number; y: number }): CharacterType {
  const absX = Math.abs(coords.x);
  const absY = Math.abs(coords.y);

  // 極端タイプの判定: 一方の軸が他方の2倍以上
  const extremeThreshold = 40;

  if (absX >= extremeThreshold && absX >= absY * 2) {
    // X軸が極端
    return coords.x > 0
      ? CHARACTER_TYPES.find((t) => t.id === "idol")!
      : CHARACTER_TYPES.find((t) => t.id === "sexy")!;
  }

  if (absY >= extremeThreshold && absY >= absX * 2) {
    // Y軸が極端
    return coords.y > 0
      ? CHARACTER_TYPES.find((t) => t.id === "partygirl")!
      : CHARACTER_TYPES.find((t) => t.id === "mysteriousqueen")!;
  }

  // 4象限タイプの判定
  if (coords.x >= 0 && coords.y >= 0) {
    return CHARACTER_TYPES.find((t) => t.id === "koakuma")!;
  }
  if (coords.x >= 0 && coords.y < 0) {
    return CHARACTER_TYPES.find((t) => t.id === "tennen")!;
  }
  if (coords.x < 0 && coords.y < 0) {
    return CHARACTER_TYPES.find((t) => t.id === "coolbeauty")!;
  }
  return CHARACTER_TYPES.find((t) => t.id === "dekiru")!;
}

function determineSecondaryType(
  coords: { x: number; y: number },
  primary: CharacterType
): CharacterType {
  // ユークリッド距離が2番目に近いタイプを探す
  const distances = CHARACTER_TYPES.filter((t) => t.id !== primary.id).map((t) => {
    const center = TYPE_CENTERS[t.id];
    const dx = coords.x - center.x;
    const dy = coords.y - center.y;
    return { type: t, distance: Math.sqrt(dx * dx + dy * dy) };
  });

  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].type;
}
