import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import {
  MagicLinkEmail,
  buildMagicLinkSubject,
  buildMagicLinkText,
} from "@/emails/magic-link";

describe("MagicLinkEmail", () => {
  const url = "https://lumina.app/api/auth/callback/nodemailer?token=xxx";

  it("件名に「マッチング」を含まない", () => {
    expect(buildMagicLinkSubject()).not.toContain("マッチング");
  });

  it("件名にサービス名 (ルミナ or LUMINA) を含む", () => {
    expect(buildMagicLinkSubject()).toMatch(/ルミナ|LUMINA/);
  });

  it("HTML 本文に「マッチング」を含まない", async () => {
    const html = await render(MagicLinkEmail({ url }));
    expect(html).not.toContain("マッチング");
  });

  it("テキスト本文に「マッチング」を含まない", () => {
    expect(buildMagicLinkText(url)).not.toContain("マッチング");
  });

  it("HTML 本文に認証 URL を含む", async () => {
    const html = await render(MagicLinkEmail({ url }));
    expect(html).toContain(url);
  });

  it("テキスト本文に認証 URL を含む", () => {
    expect(buildMagicLinkText(url)).toContain(url);
  });

  it("HTML 本文にサービス名 (ルミナ or LUMINA) を含む", async () => {
    const html = await render(MagicLinkEmail({ url }));
    expect(html).toMatch(/ルミナ|LUMINA/);
  });

  it("React Email 経由なので URL が JSX 文字列として埋め込まれ XSS 自動エスケープされる", async () => {
    const evilUrl = "https://lumina.app/?q=<script>alert(1)</script>";
    const html = await render(MagicLinkEmail({ url: evilUrl }));
    // React のエスケープにより script タグが生のまま埋め込まれない
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
