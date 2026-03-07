export const ELA_CONFIG = {
  recompressionQuality: 75,
  scoreThreshold: Number(process.env.ELA_SCORE_THRESHOLD) || 40,
  highDiffThreshold: 5,
  diffScale: 20,
  blockSize: 16,
  weights: { blockVariance: 0.7, highDiffRatio: 0.3 },
  maxAnalysisSize: 1024,
} as const;
