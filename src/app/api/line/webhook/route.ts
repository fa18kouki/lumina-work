import { validateSignature } from "@line/bot-sdk";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LINE_SIGNATURE_HEADER = "x-line-signature";

/**
 * LINE Messaging API の Webhook 受信エンドポイント。
 * チャンネル設定で「Webhook URL」に登録するURL: https://<あなたのドメイン>/api/line/webhook
 *
 * - GET: LINE の検証用。200 を返す。
 * - POST: イベント受信。署名検証後に 200 を返す（現状はイベント処理なし）。
 */
export async function GET() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get(LINE_SIGNATURE_HEADER);
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelSecret) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-line-signature header" },
      { status: 400 }
    );
  }

  const isValid = validateSignature(body, channelSecret, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 必要に応じてここで body を JSON パースしてイベント処理（メッセージ・フォロー・ポストバック等）
  return new NextResponse(null, { status: 200 });
}
