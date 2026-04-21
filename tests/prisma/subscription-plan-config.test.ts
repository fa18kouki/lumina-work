import { describe, it, expectTypeOf } from "vitest";
import type { SubscriptionPlanConfig, Subscription, Prisma } from "@prisma/client";

/**
 * RUN-237: SubscriptionPlanConfig マスタが追加され、
 * Subscription から参照できていることを型レベルで検証する。
 */
describe("SubscriptionPlanConfig model (RUN-237)", () => {
  it("SubscriptionPlanConfig 型に必須フィールドが存在する", () => {
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("plan");
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("displayName").toEqualTypeOf<string>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("offerLimit").toEqualTypeOf<number | null>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("maxStores").toEqualTypeOf<number | null>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("monthlyPriceJpy").toEqualTypeOf<number>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("stripePriceId").toEqualTypeOf<string | null>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("isActive").toEqualTypeOf<boolean>();
    expectTypeOf<SubscriptionPlanConfig>().toHaveProperty("sortOrder").toEqualTypeOf<number>();
  });

  it("Subscription に planConfigId が nullable で追加されている", () => {
    expectTypeOf<Subscription>().toHaveProperty("planConfigId").toEqualTypeOf<string | null>();
  });

  it("Subscription.include で planConfig を展開できる", () => {
    const args: Prisma.SubscriptionFindUniqueArgs = {
      where: { ownerId: "owner-1" },
      include: { planConfig: true },
    };
    expectTypeOf(args).toMatchTypeOf<Prisma.SubscriptionFindUniqueArgs>();
  });
});
