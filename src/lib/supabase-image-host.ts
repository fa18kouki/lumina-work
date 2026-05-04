/**
 * BUG-4: next.config.ts の images.remotePatterns に Supabase Storage のホストを
 * 動的に追加するためのヘルパー。NEXT_PUBLIC_SUPABASE_URL から host を抽出して、
 * cast-photos / store-photos / chat-messages の 3 バケット分の pattern を生成する。
 *
 * - ハードコード禁止: env が無いときは空配列を返し、ビルド失敗にしない
 * - 不正な URL でも例外を投げず null/空配列で安全に処理
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
