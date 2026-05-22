const MESSAGES: Record<string, string> = {
  auth_failed: "認証に失敗しました。もう一度お試しください",
  missing_code:
    "認証リンクが無効でした。もう一度ログインからやり直してください",
  not_owner:
    "このアカウントにはオーナー権限がありません。別のアカウントでログインするか、サポートまでお問い合わせください",
  account_deleted:
    "このアカウントは退会済みです。再度ご利用される場合は新規登録をお願いします",
  not_registered:
    "このメールアドレスは登録されていません。新規登録から始めてください",
  email_collision:
    "このメールアドレスは既に別のアカウントに紐付いています。サポートにお問い合わせください",
  user_provisioning_failed:
    "アカウントの初期化に失敗しました。少し時間をおいて再度お試しください",
};

/**
 * /o/login?error=xxx の error コードをユーザー向けメッセージに変換。
 * 未知の値は空文字にして、URL 由来の文字列が UI に露出しないようにする。
 */
export function ownerLoginErrorMessage(errorParam: string | null | undefined): string {
  if (!errorParam) return "";
  return MESSAGES[errorParam] ?? "";
}
