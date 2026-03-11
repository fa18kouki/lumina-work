import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata = {
  title: "特定商取引法に基づく表記 | LUMINA",
};

// NOTE: 以下の会社情報はすべて架空です。実在の企業・個人とは一切関係ありません。
const tableData = [
  { label: "販売業者", value: "株式会社LUMINA" },
  { label: "代表者", value: "佐藤 光" },
  {
    label: "所在地",
    value: "〒107-0061 東京都港区北青山1丁目2番3号 LUMINA青山ビル5F",
  },
  { label: "電話番号", value: "03-1234-5678" },
  { label: "メールアドレス", value: "support@lumina.jp" },
  { label: "法人番号", value: "1234567890123" },
  { label: "サービス名称", value: "LUMINA" },
  {
    label: "サービス内容",
    value:
      "AIを活用したキャスト（求職者）と店舗（求人者）の募集情報等提供サービス（募集情報等提供事業）",
  },
  {
    label: "販売価格",
    value:
      "店舗向けの有料プランの料金は、本サービス上の料金ページに掲載します。キャスト（求職者）は無料でご利用いただけます。",
  },
  {
    label: "販売価格以外の必要料金",
    value:
      "インターネット接続料金、通信料金等は利用者のご負担となります。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済、その他当社が定める方法",
  },
  {
    label: "支払時期",
    value:
      "有料プランの契約時にお支払いいただきます。詳細は各プランの説明をご確認ください。",
  },
  {
    label: "サービスの提供時期",
    value: "利用登録完了後、直ちにご利用いただけます。",
  },
  {
    label: "返品・キャンセル",
    value:
      "デジタルサービスの性質上、サービス提供開始後の返品・返金はお受けしておりません。ただし、当社の責に帰すべき事由によりサービスが提供できなかった場合は、該当期間分の料金を返金いたします。",
  },
  {
    label: "届出番号",
    value: "募集情報等提供事業（届出番号確認後に更新）",
  },
];

export default function TokushohoPage() {
  return (
    <LegalPageLayout
      title="特定商取引法に基づく表記"
      lastUpdated="2026年3月7日"
    >
      <p>
        特定商取引法第11条に基づき、以下のとおり表記いたします。
      </p>
      <p className="!text-xs !text-red-600">
        ※本文書はドラフトです。正式な運用前に必ず弁護士によるレビューを受けてください。
      </p>
      <p className="!text-xs !text-orange-500">
        ※記載されている会社名・代表者・住所・電話番号・法人番号はすべて架空のものです。実在の企業・個人とは一切関係ありません。
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {tableData.map((row) => (
              <tr key={row.label} className="border-b border-gray-200">
                <th className="text-left align-top py-4 pr-6 w-48 font-semibold text-[var(--text-main)] whitespace-nowrap">
                  {row.label}
                </th>
                <td className="py-4 text-[var(--text-main)]">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LegalPageLayout>
  );
}
