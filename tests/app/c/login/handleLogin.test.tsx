/**
 * @vitest-environment jsdom
 *
 * BUG-1/2: clearSession() を signIn 呼び出し前に実行すると、 LINE 認証から戻ってきた
 * 直後の DiagnosisSync が空の answers を見てしまい、 Cast への診断データ反映が失われる。
 * clearSession は DiagnosisSync が反映成功時に呼ぶべきで、ログインボタンの onClick では
 * 呼び出してはならない。
 *
 * RUN-506: Cast のメールログインは NextAuth Email Provider (`signIn("nodemailer", ...)`)
 * 一本に統一。Supabase signInWithOtp 分岐は廃止。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const signInMock = vi.fn();
const clearSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/lib/diagnosis-provider", () => ({
  useDiagnosis: () => ({
    session: null,
    clearSession: clearSessionMock,
  }),
}));

// next/image は jsdom 上で扱いづらいので素朴な img に置換
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.createElement("img", props as any);
  },
}));

// next/link は a タグにフォールバック
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...rest }, children),
}));

describe("/c/login handleLogin (BUG-1/2)", () => {
  beforeEach(() => {
    signInMock.mockReset();
    clearSessionMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.resetModules();
  });

  it("LINE ログインボタン押下時に clearSession() を呼ばない", async () => {
    const mod = await import("@/app/c/(auth)/login/page");
    const LoginPage = mod.default;

    render(React.createElement(LoginPage));

    const lineButton = await screen.findByRole("button", { name: /LINE/i });
    fireEvent.click(lineButton);

    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(signInMock).toHaveBeenCalledWith("line", expect.any(Object));
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it("メール (NextAuth Email Provider) 送信成功後も clearSession() を呼ばない", async () => {
    signInMock.mockResolvedValue({ ok: true });

    const mod = await import("@/app/c/(auth)/login/page");
    const LoginPage = mod.default;

    render(React.createElement(LoginPage));

    const showFormBtn = await screen.findByRole("button", {
      name: /メールアドレス.*ログイン/i,
    });
    fireEvent.click(showFormBtn);

    const input = await screen.findByLabelText(/メールアドレス/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const submitBtn = screen.getByRole("button", { name: /メールでログイン/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith(
        "nodemailer",
        expect.objectContaining({ email: "test@example.com" }),
      );
    });
    expect(clearSessionMock).not.toHaveBeenCalled();
  });
});
