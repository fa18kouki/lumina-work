import { render } from "@react-email/components";
import type React from "react";
import type { Mock } from "vitest";

interface EmailSendArgs {
  from: string;
  to: string;
  subject: string;
  react: React.ReactElement;
}

interface SendOptions {
  idempotencyKey?: string;
}

interface ResolvedEmailCall {
  from: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

/**
 * Resend SDK の `emails.send(emailArgs, options?)` mock 呼び出しから
 * テスト assertion で使う「render 済み HTML を含む」shape を抽出する共通 helper。
 *
 * p0 テスト (idempotencyKey あり) と p1p2 テスト (idempotencyKey なし) で
 * 同じヘルパーを使い回せるよう、`includeIdempotencyKey` フラグで切り替え可能。
 *
 * @example
 *   const args = await getEmailCallArgs(mockSend);              // p1p2: from/to/subject/html
 *   const args = await getEmailCallArgs(mockSend, {              // p0: + idempotencyKey
 *     includeIdempotencyKey: true,
 *   });
 */
export async function getEmailCallArgs(
  mockSend: Mock,
  options: { call?: number; includeIdempotencyKey?: boolean } = {},
): Promise<ResolvedEmailCall> {
  const call = options.call ?? 0;
  const [emailArgs, sendOptions] = mockSend.mock.calls[call] as [
    EmailSendArgs,
    SendOptions | undefined,
  ];
  const html = await render(emailArgs.react);
  const base: ResolvedEmailCall = {
    from: emailArgs.from,
    to: emailArgs.to,
    subject: emailArgs.subject,
    html,
  };
  if (options.includeIdempotencyKey) {
    base.idempotencyKey = sendOptions?.idempotencyKey;
  }
  return base;
}
