const MESSAGES: Record<string, string> = {
  auth_failed: "認証に失敗しました。もう一度お試しください",
  missing_code:
    "認証リンクが無効でした。もう一度ログインからやり直してください",
  not_owner:
    "このアカウントにはオーナー権限がありません。別のアカウントでログインするか、サポートまでお問い合わせください",
};

/**
 * /o/login?error=xxx の error コードをユーザー向けメッセージに変換。
 * 未知の値は空文字にして、URL 由来の文字列が UI に露出しないようにする。
 */
export function ownerLoginErrorMessage(errorParam: string | null | undefined): string {
  if (!errorParam) return "";
  return MESSAGES[errorParam] ?? "";
}
