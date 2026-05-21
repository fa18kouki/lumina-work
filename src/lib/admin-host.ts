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

/**
 * middleware が host × pathname を見て何をすべきかを決める純粋関数。
 *
 * - `rewrite`     : admin サブドメインからの UI リクエスト。内部的に `/admin/*` を読む
 * - `passthrough` : admin サブドメインからの /api や /_next 等の素通し対象
 * - `blocked`     : 素のドメインで /admin/* を叩かれた。404 を返す
 * - `main`        : それ以外。既存の認可・リダイレクトロジックに委譲
 *
 * 認可 (admin-session cookie の有無) は本関数では判定しない。
 * 「どこに振り分けるか」だけを返し、認可は middleware 本体で行う。
 */
export type AdminMiddlewareDecision =
  | { kind: "rewrite"; to: string }
  | { kind: "passthrough" }
  | { kind: "blocked" }
  | { kind: "main" };

const STATIC_ASSET_EXT = /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|map)$/i;

function isSystemPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (STATIC_ASSET_EXT.test(pathname)) return true;
  return false;
}

export function adminMiddlewareDecision(
  host: string | null | undefined,
  pathname: string,
): AdminMiddlewareDecision {
  const isAdmin = isAdminHost(host);

  // 素のドメインからの /admin/* は外部に見せない (404)
  if (!isAdmin) {
    if (
      pathname === ADMIN_PATH_PREFIX ||
      pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)
    ) {
      return { kind: "blocked" };
    }
    return { kind: "main" };
  }

  // admin サブドメインからの system path はそのまま透過
  if (isSystemPath(pathname)) {
    return { kind: "passthrough" };
  }

  return { kind: "rewrite", to: adminRewritePath(pathname) };
}
