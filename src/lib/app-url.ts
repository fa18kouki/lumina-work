/**
 * メール本文 / LINE メッセージ等で CTA URL を組み立てる際の base URL。
 *
 * 環境変数 AUTH_URL の末尾スラッシュを除去して返す。
 * 例: AUTH_URL="https://lumina.app/" → "https://lumina.app"
 *     これにより `${appUrl}/s/interviews` 等の連結で `//` を生まない。
 */
export function getAppUrl(): string {
  const raw = process.env.AUTH_URL ?? "https://lumina.app";
  return raw.replace(/\/+$/, "");
}
