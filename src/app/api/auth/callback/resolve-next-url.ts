/**
 * OAuth コールバックの ?next= クエリを同一オリジン URL として検証。
 * 外部ホストや javascript: などへのオープンリダイレクトを防ぎ、
 * 安全な相対パスのみを返す。
 */
export function resolveNextUrl(
  nextParam: string | null | undefined,
  origin: string,
  fallback: string
): string {
  if (!nextParam) return fallback;

  // protocol-relative ("//evil.com/...") は絶対 URL 扱いで外部遷移するため拒否
  if (nextParam.startsWith("//")) return fallback;

  // 安全なルート相対パス
  if (nextParam.startsWith("/")) return nextParam;

  // 絶対 URL として評価、同一オリジンのみ許可
  try {
    const url = new URL(nextParam);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
