import { describe, it, expectTypeOf } from "vitest";
import type { Owner, Prisma } from "@prisma/client";

/**
 * RUN-236: Owner モデルに追加したプロフィール項目が
 * Prisma Client の型に正しく反映されていることを型レベルで検証する。
 *
 * このテストは「必要なフィールドがスキーマから欠落したら型エラーで落ちる」こと
 * を保証するためのもので、ランタイム DB には接続しない。
 */
describe("Owner model new profile fields (RUN-236)", () => {
  it("Owner 型に代表者・請求情報・本人確認の全フィールドが存在する", () => {
    expectTypeOf<Owner>().toHaveProperty("representativeName").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>().toHaveProperty("representativeFurigana").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>().toHaveProperty("representativePhone").toEqualTypeOf<string | null>();

    expectTypeOf<Owner>().toHaveProperty("corporateNumber").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>()
      .toHaveProperty("invoiceRegistrationNumber")
      .toEqualTypeOf<string | null>();

    expectTypeOf<Owner>().toHaveProperty("headOfficeAddress").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>().toHaveProperty("billingAddress").toEqualTypeOf<string | null>();

    expectTypeOf<Owner>().toHaveProperty("billingContactName").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>().toHaveProperty("billingContactEmail").toEqualTypeOf<string | null>();
    expectTypeOf<Owner>().toHaveProperty("billingContactPhone").toEqualTypeOf<string | null>();

    // isVerified は default(false) なので non-null
    expectTypeOf<Owner>().toHaveProperty("isVerified").toEqualTypeOf<boolean>();
  });

  it("OwnerCreateInput で全ての新フィールドが受け入れられる", () => {
    const input: Prisma.OwnerCreateInput = {
      user: { connect: { id: "user-1" } },
      representativeName: "山田 太郎",
      representativeFurigana: "やまだ たろう",
      representativePhone: "03-1234-5678",
      corporateNumber: "1234567890123",
      invoiceRegistrationNumber: "T1234567890123",
      headOfficeAddress: "東京都千代田区丸の内1-1-1",
      billingAddress: "東京都千代田区大手町2-2-2",
      billingContactName: "経理 花子",
      billingContactEmail: "keiri@example.com",
      billingContactPhone: "03-9876-5432",
      isVerified: true,
    };
    expectTypeOf(input).toMatchTypeOf<Prisma.OwnerCreateInput>();
  });
});
