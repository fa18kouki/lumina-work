import { describe, it, expect } from "vitest";
import {
  parseCallbackTokens,
  resolveNextPath,
} from "@/lib/cast-login-callback";

// RUN-507: キャスト側 Magic Link callback で hash fragment / PKCE code を明示的に処理する。
// (owner 側 RUN-503 と同型の問題対応)
describe("parseCallbackTokens", () => {
  it("implicit flow: hash fragment に access_token + refresh_token があれば kind=hash", () => {
    const r = parseCallbackTokens({
      hash: "#access_token=at_123&refresh_token=rt_456&type=magiclink",
      searchParams: new URLSearchParams(""),
    });

    expect(r).toEqual({
      kind: "hash",
      accessToken: "at_123",
      refreshToken: "rt_456",
      linkType: "magiclink",
    });
  });

  it("hash の type は省略可 (linkType=null になる)", () => {
    const r = parseCallbackTokens({
      hash: "#access_token=at_x&refresh_token=rt_y",
      searchParams: new URLSearchParams(""),
    });

    expect(r).toEqual({
      kind: "hash",
      accessToken: "at_x",
      refreshToken: "rt_y",
      linkType: null,
    });
  });

  it("hash に access_token だけで refresh_token が無ければ kind=none (不完全なリンクは黙って捨てる)", () => {
    const r = parseCallbackTokens({
      hash: "#access_token=at_only",
      searchParams: new URLSearchParams(""),
    });

    expect(r.kind).toBe("none");
  });

  it("PKCE flow: ?code= があれば kind=code", () => {
    const r = parseCallbackTokens({
      hash: "",
      searchParams: new URLSearchParams("code=abc123&next=%2Fc%2Fdashboard"),
    });

    expect(r).toEqual({ kind: "code", code: "abc123" });
  });

  it("hash と code が両方ある場合は hash を優先 (implicit が成立しているなら setSession で十分)", () => {
    const r = parseCallbackTokens({
      hash: "#access_token=at_z&refresh_token=rt_z",
      searchParams: new URLSearchParams("code=should_be_ignored"),
    });

    expect(r.kind).toBe("hash");
    if (r.kind === "hash") {
      expect(r.accessToken).toBe("at_z");
    }
  });

  it("token も code も無ければ kind=none (例: 既にセッションがある状態の素アクセス)", () => {
    const r = parseCallbackTokens({
      hash: "",
      searchParams: new URLSearchParams(""),
    });

    expect(r.kind).toBe("none");
  });

  it("hash 先頭の # は無くてもパースできる (一部ブラウザ実装互換)", () => {
    const r = parseCallbackTokens({
      hash: "access_token=at_a&refresh_token=rt_b&type=invite",
      searchParams: new URLSearchParams(""),
    });

    expect(r).toEqual({
      kind: "hash",
      accessToken: "at_a",
      refreshToken: "rt_b",
      linkType: "invite",
    });
  });

  it("hash に access_token という文字が含まれない場合は PKCE 経路にフォールバックする", () => {
    // 過去のセッションで残った別パラメータ等が紛れ込むケース
    const r = parseCallbackTokens({
      hash: "#error_description=Invalid",
      searchParams: new URLSearchParams("code=fallback_code"),
    });

    expect(r).toEqual({ kind: "code", code: "fallback_code" });
  });
});

describe("resolveNextPath", () => {
  it("null なら /c/dashboard にフォールバック", () => {
    expect(resolveNextPath(null)).toBe("/c/dashboard");
  });

  it("空文字なら /c/dashboard にフォールバック", () => {
    expect(resolveNextPath("")).toBe("/c/dashboard");
  });

  it("/ 始まりのローカルパスはそのまま (URL デコード)", () => {
    expect(resolveNextPath("/c/profile")).toBe("/c/profile");
    expect(resolveNextPath("/c/stores/abc%20def")).toBe("/c/stores/abc def");
  });

  it("オープンリダイレクト防止: http(s):// は弾く", () => {
    expect(resolveNextPath("https://evil.example.com")).toBe("/c/dashboard");
    expect(resolveNextPath("http://evil.example.com/path")).toBe("/c/dashboard");
  });

  it("オープンリダイレクト防止: プロトコル相対 // も弾く", () => {
    expect(resolveNextPath("//evil.example.com/path")).toBe("/c/dashboard");
  });

  it("オープンリダイレクト防止: バックスラッシュ \\\\ 始まりも弾く (一部ブラウザで // と解釈される)", () => {
    expect(resolveNextPath("\\\\evil.example.com")).toBe("/c/dashboard");
  });

  it("/ 始まり以外の相対パスは弾く", () => {
    expect(resolveNextPath("c/dashboard")).toBe("/c/dashboard");
    expect(resolveNextPath("javascript:alert(1)")).toBe("/c/dashboard");
  });

  it("decodeURIComponent が失敗するケースは安全に fallback", () => {
    // %ZZ は不正な URL エンコード
    expect(resolveNextPath("/c/%ZZ")).toBe("/c/dashboard");
  });
});
