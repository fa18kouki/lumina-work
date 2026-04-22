import { describe, it, expect } from "vitest";
import { buildVerificationEmail } from "@/lib/auth-email-template";

describe("buildVerificationEmail", () => {
  const url = "https://lumina.app/api/auth/callback/nodemailer?token=xxx";
  const host = "lumina.app";

  it("件名に「マッチング」を含まない", () => {
    const { subject } = buildVerificationEmail({ url, host });
    expect(subject).not.toContain("マッチング");
  });

  it("件名にサービス名（ルミナ or LUMINA）を含む", () => {
    const { subject } = buildVerificationEmail({ url, host });
    expect(subject).toMatch(/ルミナ|LUMINA/);
  });

  it("HTML 本文に「マッチング」を含まない", () => {
    const { html } = buildVerificationEmail({ url, host });
    expect(html).not.toContain("マッチング");
  });

  it("テキスト本文に「マッチング」を含まない", () => {
    const { text } = buildVerificationEmail({ url, host });
    expect(text).not.toContain("マッチング");
  });

  it("HTML 本文に認証 URL を含む", () => {
    const { html } = buildVerificationEmail({ url, host });
    expect(html).toContain(url);
  });

  it("テキスト本文に認証 URL を含む", () => {
    const { text } = buildVerificationEmail({ url, host });
    expect(text).toContain(url);
  });

  it("HTML 本文にサービス名（ルミナ or LUMINA）を含む", () => {
    const { html } = buildVerificationEmail({ url, host });
    expect(html).toMatch(/ルミナ|LUMINA/);
  });

  it("HTML/URL がエスケープされている（XSS 対策）", () => {
    const evilUrl = "https://lumina.app/?q=<script>alert(1)</script>";
    const { html } = buildVerificationEmail({ url: evilUrl, host });
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
