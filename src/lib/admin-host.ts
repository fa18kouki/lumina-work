/**
 * 管理画面サブドメイン (admin.<host>) と通常ドメインを切り分けるための純粋関数。
 *
 * middleware から直接 `req.headers.get("host")` を渡して使う。
 * テスタビリティのため副作用ゼロで切り出している。
 */

const ADMIN_SUBDOMAIN_PREFIX = "admin.";
const ADMIN_PATH_PREFIX = "/admin";

/**
 * host が admin サブドメインかを判定する。
 *
 * 受け入れる host 例:
 *   - "admin.localhost:3000"
 *   - "admin.lumina-work.jp"
 *   - "ADMIN.lumina-work.jp" (大文字小文字無視)
 *
 * 拒否する host 例:
 *   - "lumina-work.jp"        (素のドメイン)
 *   - "localhost:3000"        (ローカル素)
 *   - "myadmin.com"           ("admin" が prefix でない)
 *   - "not-admin.lumina-work.jp"
 *   - "admins.lumina-work.jp" (s 付き)
 */
export function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.toLowerCase().split(":")[0];
  return hostname.startsWith(ADMIN_SUBDOMAIN_PREFIX);
}

/**
 * admin サブドメインからのリクエストを、内部的に `/admin/*` 配下にマップする。
 *
 * - "/" → "/admin"
 * - "/foo" → "/admin/foo"
 * - "/admin", "/admin/foo" は idempotent (再 prefix しない)
 *
 * 注意: /api や /_next の素通しは middleware 側の責務。本関数は単純な prefix 変換のみ。
 */
export function adminRewritePath(pathname: string): string {
  if (pathname === ADMIN_PATH_PREFIX) return ADMIN_PATH_PREFIX;
  if (pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)) return pathname;
  if (pathname === "/") return ADMIN_PATH_PREFIX;
  return `${ADMIN_PATH_PREFIX}${pathname}`;
}
