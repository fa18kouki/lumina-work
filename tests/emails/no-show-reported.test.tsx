import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { NoShowReportedEmail } from "@/emails/no-show-reported";

describe("NoShowReportedEmail", () => {
  it("penaltyCount=1 では警告メッセージなし", async () => {
    const html = await render(
      NoShowReportedEmail({ storeName: "Club A", penaltyCount: 1 }),
    );
    expect(html).toContain("ペナルティ: 1回目/3回");
    expect(html).not.toContain("次回の無断欠席でアカウントが停止されます");
    expect(html).not.toContain("規定回数 (3 回) に達したため");
  });

  it("penaltyCount=2 では予告メッセージを出す", async () => {
    const html = await render(
      NoShowReportedEmail({ storeName: "Club A", penaltyCount: 2 }),
    );
    expect(html).toContain("ペナルティ: 2回目/3回");
    expect(html).toContain("次回の無断欠席でアカウントが停止されます");
    expect(html).not.toContain("規定回数 (3 回) に達したため");
  });

  it("penaltyCount=3 では停止確定メッセージを出す", async () => {
    const html = await render(
      NoShowReportedEmail({ storeName: "Club A", penaltyCount: 3 }),
    );
    expect(html).toContain("ペナルティ: 3回目/3回");
    expect(html).toContain("規定回数 (3 回) に達したため、アカウントが停止されました");
    // 予告メッセージは出さない (もう停止済みのため)
    expect(html).not.toContain("次回の無断欠席でアカウントが停止されます");
  });
});
