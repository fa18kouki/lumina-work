import { redirect } from "next/navigation";

/**
 * 新規登録のアカウント選択画面は廃止。
 * キャストは診断（AIチャット）後にログイン画面で登録。
 * 店舗は /s/register から登録する。
 */
export default function RegisterPage() {
  redirect("/");
}
