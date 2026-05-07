/**
 * BUG-4: next.config.ts の images.remotePatterns に Supabase Storage のホストを
 * 動的に追加するためのヘルパー。NEXT_PUBLIC_SUPABASE_URL から host を抽出して、
 * cast-photos / store-photos / chat-messages の 3 バケット分の pattern を生成する。
 *
 * - ハードコード禁止: env が無いときは空配列を返し、ビルド失敗にしない
 * - 不正な URL でも例外を投げず null/空配列で安全に処理
 *
 * C-1: 本番ビルドで env が未設定だと画像が全死するので、
 *   `assertSupabaseImageEnv()` を next.config.ts から呼んで早期に検知する。
 */

export interface SupabaseImageRemotePattern {
  protocol: "https";
  hostname: string;
  pathname: string;
}

const SUPABASE_PUBLIC_BUCKETS = [
  "cast-photos",
  "store-photos",
  "chat-messages",
] as const;

export function extractSupabaseImageHost(
  rawUrl: string | undefined,
): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return url.hostname || null;
  } catch {
    return null;
  }
}

export function buildSupabaseImageRemotePatterns(
  rawUrl: string | undefined,
): SupabaseImageRemotePattern[] {
  const hostname = extractSupabaseImageHost(rawUrl);
  if (!hostname) return [];

  return SUPABASE_PUBLIC_BUCKETS.map((bucket) => ({
    protocol: "https" as const,
    hostname,
    pathname: `/storage/v1/object/public/${bucket}/**`,
  }));
}

/**
 * C-1: NEXT_PUBLIC_SUPABASE_URL が空だと remotePatterns が空配列になり、
 *   本番で next/image が全画像を最適化拒否する (404 / placeholder 化) ため、
 *   ビルド時に気付かせる。
 *
 * - production: throw (ビルド失敗させて修正を強制)
 * - それ以外 (development / test など): console.warn のみ
 * - 設定済: no-op
 */
export function assertSupabaseImageEnv(env: NodeJS.ProcessEnv): void {
  const value = env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof value === "string" && value.length > 0) return;

  const message =
    "[next.config] NEXT_PUBLIC_SUPABASE_URL is not set. " +
    "Supabase Storage images will not be allowed by next/image. " +
    "Set NEXT_PUBLIC_SUPABASE_URL in your environment to fix this.";

  if (env.NODE_ENV === "production") {
    throw new Error(message);
  }
  console.warn(message);
}
