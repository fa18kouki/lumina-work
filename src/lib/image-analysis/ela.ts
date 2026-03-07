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

function computePixelDiffs(
  originalData: Buffer,
  recompressedData: Buffer,
  width: number,
  height: number,
  diffScale: number,
  highDiffThreshold: number
) {
  const totalChannels = width * height * 3;
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
        pixelDiff += Math.min(255, d * diffScale);
        if (d > highDiffThreshold) highDiffCount++;
      }
      diffMap[y * width + x] = pixelDiff / 3;
      sumDiff += pixelDiff;
      if (pixelDiff > maxDiff) maxDiff = pixelDiff;
    }
  }

  return {
    diffMap,
    meanDifference: sumDiff / totalChannels,
    maxDifference: Math.round(maxDiff / 3),
    highDiffRatio: highDiffCount / totalChannels,
  };
}

function computeBlockStdDev(
  diffMap: Float64Array,
  width: number,
  height: number,
  blockSize: number
): number {
  const blocksX = Math.floor(width / blockSize);
  const blocksY = Math.floor(height / blockSize);
  const blockMeans: number[] = [];

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let blockSum = 0;
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          blockSum += diffMap[(by * blockSize + dy) * width + (bx * blockSize + dx)];
        }
      }
      blockMeans.push(blockSum / (blockSize * blockSize));
    }
  }

  if (blockMeans.length === 0) return 0;

  let sum = 0;
  for (const m of blockMeans) sum += m;
  const mean = sum / blockMeans.length;

  let varianceSum = 0;
  for (const m of blockMeans) {
    const d = m - mean;
    varianceSum += d * d;
  }

  return Math.sqrt(varianceSum / blockMeans.length);
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

  const original = sharp(imageBuffer).resize(maxAnalysisSize, maxAnalysisSize, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const { data: originalData, info } = await original
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const recompressedBuffer = await original
    .jpeg({ quality: recompressionQuality })
    .toBuffer();

  const { data: recompressedData } = await sharp(recompressedBuffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  const { diffMap, meanDifference, maxDifference, highDiffRatio } = computePixelDiffs(
    originalData,
    recompressedData,
    width,
    height,
    diffScale,
    highDiffThreshold
  );

  const blockStdDev = computeBlockStdDev(diffMap, width, height, blockSize);

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
      maxDifference,
      highDiffRatio: Math.round(highDiffRatio * 10000) / 10000,
    },
  };
}
