# LINE リッチメニュー設定ガイド

友だち追加したユーザーに、トーク画面下部に表示される「リッチメニュー」を設定する方法です。

---

## Webhook URL の登録（Messaging API 設定画面）

LINE Developers の Messaging API タブにある「Webhook URL」には、次のURLを登録してください。

- **本番・ステージング**: `https://<あなたのドメイン>/api/line/webhook`
- **ローカル検証**: ngrok 等で HTTPS のトンネルを張り、`https://<トンネルホスト>/api/line/webhook` を登録

受信エンドポイントは `src/app/api/line/webhook/route.ts` です。署名検証には `.env` の `LINE_CHANNEL_SECRET` を使用します。

---

## 選択肢

### 1. LINE Official Account Manager（GUI）で設定する

- [LINE Official Account Manager](https://manager.line.biz/) にログインし、対象の公式アカウントを選択
- 「リッチメニュー」から新規作成し、画像アップロードとタップ領域の設定を画面で行う
- デザインガイドやテンプレート画像のダウンロードも同画面から可能
- 運用担当がコードを触らずに変更したい場合に向いている

### 2. Messaging API（コード）で設定する

- 既存の `LINE_CHANNEL_ACCESS_TOKEN` を使い、`@line/bot-sdk` でリッチメニューを作成・画像アップロード・デフォルト設定まで一括で行える
- 手順は以下「APIで設定する手順」を参照
- デプロイ時や環境ごとに同じメニューを再現したい場合に向いている

---

## 画像の要件

- **サイズ**: 2500 x 1686 px（高さ1686）または 2500 x 843 px（高さ843）
- **形式**: PNG または JPEG
- **ファイルサイズ**: 1MB 以下

タップ領域（areas）の座標は、この画像サイズに合わせて指定します。

---

## APIで設定する手順

### 1. リッチメニュー用画像を用意する

上記のサイズで画像を用意し、例えば `scripts/richmenu.png` に保存します。  
タップ領域のレイアウトに合わせて、後述の `areas` の `bounds`（x, y, width, height）を決めます。

### 2. 環境変数を確認する

`.env` に以下が設定されていることと、本番の公式アカウント用トークンを使う場合は本番用であることを確認します。

- `LINE_CHANNEL_ACCESS_TOKEN`
- （任意）`AUTH_URL` … メニューから開くURLのベース（未設定時はスクリプト内のデフォルトを使用）

### 3. スクリプトで作成・設定する

```bash
node scripts/set-line-rich-menu.mjs scripts/richmenu.png
```

または、画像パスを省略すると「画像なし」でリッチメニューオブジェクトだけ作成し、画像は後から Manager で差し替えることもできます（スクリプトの `--dry-run` や画像未指定時の挙動を参照）。

### 4. 動作確認

対象のLINE公式アカウントを友だち追加し、トーク画面下部の「メニュー」または「Tap to open」をタップして、リッチメニューが表示されることを確認します。

---

## リッチメニューオブジェクトのカスタマイズ

`scripts/set-line-rich-menu.mjs` 内の `createRichMenuRequest()` を編集すると、以下を変更できます。

- **name**: 管理用の名前（ユーザーには非表示）
- **chatBarText**: メニューが閉じているときに表示するテキスト（例: 「メニュー」）
- **areas**: タップ領域の配列
  - **bounds**: 領域の位置とサイズ（x, y, width, height）。画像サイズ 2500x1686 に対してピクセル単位で指定
  - **action**: タップ時の動作
    - **uri**: 指定URLを開く（例: アプリのオファー一覧、ログイン画面）
    - **message**: テキストメッセージを送信
    - **postback**: データをポストバック（Webhookで受信して処理可能）

公式仕様: [リッチメニューを使う](https://developers.line.biz/ja/docs/messaging-api/using-rich-menus/) / [リッチメニューオブジェクト](https://developers.line.biz/ja/reference/messaging-api/#rich-menu-object)

---

## ユーザー単位のリッチメニュー

キャスト向け・店舗向けなど、ユーザーごとに別のリッチメニューを出し分けたい場合は、Messaging API の「ユーザー単位のリッチメニュー」を使います。

- デフォルトリッチメニューを設定したうえで、`linkRichMenuIdToUser(userId, richMenuId)` でユーザーごとに別のリッチメニューをリンクできる
- 既存の `line.ts` 通知と同様に、`LINE_CHANNEL_ACCESS_TOKEN` と Messaging API クライアントを使い、Webhook やログイン後の処理で `linkRichMenuIdToUser` を呼ぶ実装が可能

参考: [ユーザー単位のリッチメニューを使う](https://developers.line.biz/ja/docs/messaging-api/use-per-user-rich-menus/)
