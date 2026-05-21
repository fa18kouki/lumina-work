import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { OfferAcceptedEmail } from "@/emails/offer-accepted";

describe("OfferAcceptedEmail", () => {
  const appUrl = "https://lumina.app";

  it("連絡先がある場合は「下記の連絡先から」と案内する", async () => {
    const html = await render(
      OfferAcceptedEmail({
        castNickname: "アリス",
        castPhone: "09012345678",
        castEmail: null,
        castLineId: null,
        appUrl,
      }),
    );
    expect(html).toContain("アリス");
    expect(html).toContain("下記の連絡先から直接ご連絡ください");
    expect(html).toContain("09012345678");
    expect(html).not.toContain("詳細はマイページでご確認ください");
  });

  it("連絡先が全て null の場合は「下記の連絡先」を出さずマイページ案内にする", async () => {
    const html = await render(
      OfferAcceptedEmail({
        castNickname: "アリス",
        castPhone: null,
        castEmail: null,
        castLineId: null,
        appUrl,
      }),
    );
    expect(html).toContain("アリス");
    expect(html).toContain("詳細はマイページでご確認ください");
    expect(html).not.toContain("下記の連絡先");
    // 連絡先 Section は出ない
    expect(html).not.toContain("キャスト連絡先");
  });
});
