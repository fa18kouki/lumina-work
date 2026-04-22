/**
 * 生年月日から満年齢を計算する純粋関数。
 * - 未来日および 1 歳未満は 0 を返す（防御的挙動）
 * - うるう年 2/29 生まれは非うるう年では 3/1 に加齢扱いとなる
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  if (birthDate.getTime() > referenceDate.getTime()) {
    return 0;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  const dayDiff = referenceDate.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age < 0 ? 0 : age;
}

/**
 * 選択式で入力された age と、任意で提供された birthDate から最終的な年齢を決める。
 * birthDate があればそこから再計算した値を優先し、選択式の丸めを上書きする。
 */
export function resolveAge(
  selectedAge: number | undefined,
  birthDate: Date | null | undefined,
  referenceDate?: Date,
): number | undefined {
  if (birthDate) {
    return calculateAge(birthDate, referenceDate);
  }
  return selectedAge;
}
