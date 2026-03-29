/**
 * トップのお知らせ帯（参考: nomination.co.jp のお知らせエリア）
 */
export function LpNoticeBar() {
  return (
    <div className="border-b border-pink-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-3 text-center sm:justify-between sm:text-left sm:px-6">
        <span className="rounded-full bg-pink-500 px-3 py-0.5 text-xs font-bold text-white">
          お知らせ
        </span>
        <p className="text-sm text-stone-700">
          キャバクラ・クラブ・ラウンジなど、ナイトワーク求人の検索とAI時給診断に対応しています。
        </p>
      </div>
    </div>
  );
}
