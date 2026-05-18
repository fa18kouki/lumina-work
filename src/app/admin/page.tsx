export default function AdminIndexPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">管理画面</h2>
      <p className="text-sm text-slate-600">
        この画面は admin サブドメインからのみアクセスできます。
        認証フォームと招待管理 UI は次フェーズで追加されます。
      </p>
    </section>
  );
}
