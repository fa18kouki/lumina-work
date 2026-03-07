import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { analyzeEla, type ElaResult } from "@/lib/image-analysis/ela";

// テスト用画像をsharpで生成するヘルパー
async function createUniformImage(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
}

async function createPatchedImage(
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number },
  patchColor: { r: number; g: number; b: number },
  patchRect: { left: number; top: number; width: number; height: number }
): Promise<Buffer> {
  // 背景画像を作成
  const bg = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: bgColor,
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();

  // パッチ画像を作成
  const patch = await sharp({
    create: {
      width: patchRect.width,
      height: patchRect.height,
      channels: 3,
      background: patchColor,
    },
  })
    .png()
    .toBuffer();

  // 背景にパッチを合成
  return sharp(bg)
    .composite([
      {
        input: patch,
        left: patchRect.left,
        top: patchRect.top,
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

describe("analyzeEla", () => {
  it("均一な画像は低スコアを返す", async () => {
    const image = await createUniformImage(200, 200, {
      r: 128,
      g: 128,
      b: 128,
    });
    const result = await analyzeEla(image);

    expect(result.score).toBeLessThan(20);
    expect(result.isManipulated).toBe(false);
  });

  it("不均一な差分（部分加工）は高スコアを返す", async () => {
    // JPEG圧縮済みの画像に未圧縮のパッチを合成 → ELA差分が不均一になる
    const baseImage = await createUniformImage(400, 400, {
      r: 100,
      g: 100,
      b: 100,
    });

    // JPEG圧縮を複数回通して安定させる
    const compressed = await sharp(baseImage)
      .jpeg({ quality: 60 })
      .toBuffer();
    const recompressed = await sharp(compressed)
      .jpeg({ quality: 60 })
      .toBuffer();

    // 安定した圧縮画像に鮮明なパッチを合成（加工のシミュレーション）
    const manipulated = await sharp(recompressed)
      .composite([
        {
          input: await sharp({
            create: {
              width: 150,
              height: 150,
              channels: 3,
              background: { r: 255, g: 0, b: 0 },
            },
          })
            .png()
            .toBuffer(),
          left: 125,
          top: 125,
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await analyzeEla(manipulated);

    // パッチ部分と背景で圧縮レベルが異なるため、差分が不均一になる
    expect(result.score).toBeGreaterThan(20);
  });

  it("スコアは0-100の範囲を返す", async () => {
    const image = await createUniformImage(200, 200, {
      r: 200,
      g: 50,
      b: 100,
    });
    const result = await analyzeEla(image);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("無加工画像はisManipulated: falseを返す", async () => {
    const image = await createUniformImage(300, 300, {
      r: 180,
      g: 180,
      b: 180,
    });
    const result = await analyzeEla(image);

    expect(result.isManipulated).toBe(false);
  });

  it("閾値超過でisManipulated: trueを返す", async () => {
    // 極端に不均一な画像を作成（高い閾値を超えるように）
    const baseCompressed = await sharp(
      await createUniformImage(400, 400, { r: 50, g: 50, b: 50 })
    )
      .jpeg({ quality: 30 })
      .toBuffer();

    // さらに圧縮して安定させる
    const doubleCompressed = await sharp(baseCompressed)
      .jpeg({ quality: 30 })
      .toBuffer();

    // 鮮明な大きいパッチを合成
    const manipulated = await sharp(doubleCompressed)
      .composite([
        {
          input: await sharp({
            create: {
              width: 200,
              height: 200,
              channels: 3,
              background: { r: 255, g: 255, b: 0 },
            },
          })
            .png()
            .toBuffer(),
          left: 100,
          top: 100,
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await analyzeEla(manipulated);

    expect(result.isManipulated).toBe(true);
    expect(result.score).toBeGreaterThan(40);
  });

  it("詳細統計値を返す", async () => {
    const image = await createUniformImage(200, 200, {
      r: 100,
      g: 100,
      b: 100,
    });
    const result = await analyzeEla(image);

    expect(result.details).toBeDefined();
    expect(typeof result.details.meanDifference).toBe("number");
    expect(typeof result.details.stdDeviation).toBe("number");
    expect(typeof result.details.maxDifference).toBe("number");
    expect(typeof result.details.highDiffRatio).toBe("number");

    expect(result.details.meanDifference).toBeGreaterThanOrEqual(0);
    expect(result.details.stdDeviation).toBeGreaterThanOrEqual(0);
    expect(result.details.maxDifference).toBeGreaterThanOrEqual(0);
    expect(result.details.highDiffRatio).toBeGreaterThanOrEqual(0);
    expect(result.details.highDiffRatio).toBeLessThanOrEqual(1);
  });

  it("不正なバッファでエラーを投げる", async () => {
    const invalidBuffer = Buffer.from("not an image");
    await expect(analyzeEla(invalidBuffer)).rejects.toThrow();
  });

  it("PNG画像も解析できる", async () => {
    const pngImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .png()
      .toBuffer();

    const result = await analyzeEla(pngImage);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
