import sharp from "sharp";
import { ELA_CONFIG } from "./constants";

export interface ElaResult {
  score: number;
  isManipulated: boolean;
  details: {
    meanDifference: number;
    stdDeviation: number;
    maxDifference: number;
    highDiffRatio: number;
  };
}

export async function analyzeEla(imageBuffer: Buffer): Promise<ElaResult> {
  const {
    recompressionQuality,
    maxAnalysisSize,
    highDiffThreshold,
    diffScale,
    blockSize,
    weights,
    scoreThreshold,
  } = ELA_CONFIG;

  // 元画像を読み込み、解析用サイズにリサイズ
  const original = sharp(imageBuffer).resize(maxAnalysisSize, maxAnalysisSize, {
    fit: "inside",
    withoutEnlargement: true,
  });

  // rawピクセルデータ取得（元画像）
  const { data: originalData, info } = await original
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // JPEG再圧縮 → rawピクセルデータ取得
  const recompressedBuffer = await original
    .jpeg({ quality: recompressionQuality })
    .toBuffer();

  const { data: recompressedData } = await sharp(recompressedBuffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalChannels = width * height * 3;

  // ELA差分マップを作成（差分を増幅）
  const diffMap = new Float64Array(width * height);
  let sumDiff = 0;
  let maxDiff = 0;
  let highDiffCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = (y * width + x) * 3;
      let pixelDiff = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(originalData[pixelIdx + c] - recompressedData[pixelIdx + c]);
        const scaled = Math.min(255, d * diffScale);
        pixelDiff += scaled;
        if (d > highDiffThreshold) highDiffCount++;
      }
      const avgDiff = pixelDiff / 3;
      diffMap[y * width + x] = avgDiff;
      sumDiff += pixelDiff;
      if (pixelDiff > maxDiff) maxDiff = pixelDiff;
    }
  }

  const meanDifference = sumDiff / totalChannels;
  const highDiffRatio = highDiffCount / totalChannels;

  // ブロック単位の平均ELA差分を計算
  const blocksX = Math.floor(width / blockSize);
  const blocksY = Math.floor(height / blockSize);
  const blockMeans: number[] = [];

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let blockSum = 0;
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const y = by * blockSize + dy;
          const x = bx * blockSize + dx;
          blockSum += diffMap[y * width + x];
        }
      }
      blockMeans.push(blockSum / (blockSize * blockSize));
    }
  }

  // ブロック間の標準偏差を計算（不均一性の指標）
  let blockMeanSum = 0;
  for (const m of blockMeans) blockMeanSum += m;
  const blockGrandMean = blockMeans.length > 0 ? blockMeanSum / blockMeans.length : 0;

  let blockVarianceSum = 0;
  for (const m of blockMeans) {
    const d = m - blockGrandMean;
    blockVarianceSum += d * d;
  }
  const blockStdDev =
    blockMeans.length > 0
      ? Math.sqrt(blockVarianceSum / blockMeans.length)
      : 0;

  // 複合スコア算出
  // blockStdDevを正規化（増幅済み差分のため、stdDev > 30 で高い不均一性）
  const normalizedBlockVar = Math.min(100, (blockStdDev / 30) * 100);
  const rawScore =
    weights.blockVariance * normalizedBlockVar +
    weights.highDiffRatio * Math.min(100, highDiffRatio * 100);

  const score = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));

  return {
    score,
    isManipulated: score > scoreThreshold,
    details: {
      meanDifference: Math.round(meanDifference * 1000) / 1000,
      stdDeviation: Math.round(blockStdDev * 1000) / 1000,
      maxDifference: Math.round(maxDiff / 3),
      highDiffRatio: Math.round(highDiffRatio * 10000) / 10000,
    },
  };
}
