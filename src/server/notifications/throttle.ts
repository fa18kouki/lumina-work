const THROTTLE_TTL_MS = 5 * 60 * 1000; // 5分

const lastSentMap = new Map<string, number>();

/**
 * メッセージ通知のスロットリング判定
 * 同一match+受信者に対して5分間はLINE/Emailを抑制する
 * InApp通知は常に作成するため、このチェックはLINE/Emailのみ適用
 *
 * @returns true = 抑制すべき, false = 送信可能
 */
export function shouldThrottle(matchId: string, recipientUserId: string): boolean {
  const key = `msg_notify:${matchId}:${recipientUserId}`;
  const now = Date.now();
  const lastSent = lastSentMap.get(key);

  if (lastSent && now - lastSent < THROTTLE_TTL_MS) {
    return true;
  }

  lastSentMap.set(key, now);
  return false;
}
