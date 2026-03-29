/**
 * トップLP用のオリジナル画像（public/lp/lumina）。
 * 競合参考素材の代替として生成したアセットのパスを集約する。
 */
const base = "/lp/lumina";

export const lpLuminaAssets = {
  heroMockup: `${base}/lumina-hero-mockup.png`,
  flow01Register: `${base}/lumina-flow-01-register.png`,
  flow02AiChat: `${base}/lumina-flow-02-ai-chat.png`,
  flow03Result: `${base}/lumina-flow-03-result.png`,
  flow04Stores: `${base}/lumina-flow-04-stores.png`,
  flow05Offers: `${base}/lumina-flow-05-offers.png`,
  servicePoint1: `${base}/lumina-service-point-1.png`,
  servicePoint2: `${base}/lumina-service-point-2.png`,
  servicePoint3: `${base}/lumina-service-point-3.png`,
} as const;

export type LpLuminaAssetKey = keyof typeof lpLuminaAssets;

/** ビルドやテストで存在確認するとき用 */
export const lpLuminaAssetPaths: string[] = Object.values(lpLuminaAssets);
