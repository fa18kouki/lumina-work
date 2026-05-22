/**
 * RUN-507: キャスト側 Magic Link callback の URL 解析ユーティリティ。
 *
 * Supabase のメール認証リンクは、テンプレート / クライアント設定によって
 *   - implicit flow: hash fragment (#access_token=...&refresh_token=...&type=...)
 *   - PKCE flow:     query string (?code=...)
 * のいずれかで戻ってくる。`@supabase/ssr` の createBrowserClient はデフォルトで
 * detectSessionInUrl: true だが、React の useEffect サイクルとレースする/フローが
 * 切り替わるとどちらかが死ぬという問題が owner 側 (RUN-503) で踏み抜かれており、
 * cast 側も同様に明示処理する必要がある。
 *
 * この純関数はページコンポーネントから副作用を分離し、テスト可能にするためのもの。
 */

export type CallbackTokens =
  | {
      kind: "hash";
      accessToken: string;
      refreshToken: string;
      linkType: string | null;
    }
  | { kind: "code"; code: string }
  | { kind: "none" };

export interface ParseCallbackTokensInput {
  hash: string;
  searchParams: URLSearchParams;
}

export function parseCallbackTokens(
  input: ParseCallbackTokensInput,
): CallbackTokens {
  // 1. implicit flow を先に試す。"access_token" の文字列が hash に出てこない場合は
  //    そもそも URLSearchParams への変換をスキップ (頻度の低いガード処理だが、
  //    一部ブラウザの戻る/再読み込みで残った別パラメータと取り違えないため)。
  if (input.hash.includes("access_token")) {
    const raw = input.hash.startsWith("#") ? input.hash.slice(1) : input.hash;
    const params = new URLSearchParams(raw);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      return {
        kind: "hash",
        accessToken,
        refreshToken,
        linkType: params.get("type"),
      };
    }
    // access_token はあるが refresh_token が無い = 不完全なリンク。
    // 後段の "code=" フォールバックに進ませる (どちらも無ければ kind=none)。
  }

  const code = input.searchParams.get("code");
  if (code) {
    return { kind: "code", code };
  }

  return { kind: "none" };
}

/**
 * `?next=` で渡された遷移先を検証する。
 *
 * Open redirect 防止のため、許可するのは「単一スラッシュで始まるローカルパス」のみ。
 * - `//evil.com` (プロトコル相対) と `\\evil.com` (バックスラッシュ; 一部ブラウザで
 *   `//` と解釈される) は弾く
 * - `http://`, `https://`, `javascript:` 等のスキーム付きは弾く
 * - URL デコード失敗時 (`%ZZ` 等) はフォールバック
 */
export function resolveNextPath(nextRaw: string | null): string {
  const fallback = "/c/dashboard";
  if (!nextRaw) return fallback;
  if (!nextRaw.startsWith("/")) return fallback;
  // "//evil" や "\\evil" を弾く
  if (nextRaw.startsWith("//") || nextRaw.startsWith("/\\")) return fallback;
  if (nextRaw.startsWith("\\")) return fallback;

  try {
    return decodeURIComponent(nextRaw);
  } catch {
    return fallback;
  }
}
