const SERVICE_NAME = "ルミナ";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface VerificationEmailParams {
  url: string;
  host: string;
}

export interface VerificationEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildVerificationEmail({
  url,
  host: _host,
}: VerificationEmailParams): VerificationEmail {
  const safeUrl = escapeHtml(url);
  const subject = `【${SERVICE_NAME}】ログイン用リンクのお知らせ`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">LUMINA</h1>
      </div>
      <div style="padding: 24px; background: #ffffff;">
        <h2 style="color: #1a1a2e; margin-top: 0;">${SERVICE_NAME}にログインする</h2>
        <p style="color: #333; line-height: 1.6;">
          ${SERVICE_NAME}をご利用いただきありがとうございます。下のボタンからログインしてください。
        </p>
        <p style="color: #333; line-height: 1.6;">
          このリンクは短時間のみ有効です。心当たりのない場合は、このメールは破棄してください。
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${safeUrl}"
             style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            ${SERVICE_NAME}にログイン
          </a>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.6; margin-top: 24px;">
          ボタンが動作しない場合は、次の URL をブラウザに直接貼り付けてください：<br />
          <span style="word-break: break-all;">${safeUrl}</span>
        </p>
      </div>
      <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>このメールは${SERVICE_NAME}から自動送信されています。</p>
      </div>
    </div>
  `;

  const text = `${SERVICE_NAME}にログイン

${SERVICE_NAME}をご利用いただきありがとうございます。
下の URL からログインしてください。

${url}

このリンクは短時間のみ有効です。心当たりのない場合は、このメールは破棄してください。

-- ${SERVICE_NAME}
`;

  return { subject, html, text };
}
