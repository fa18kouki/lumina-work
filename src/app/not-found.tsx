import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-gray)">
      <div className="text-center px-6">
        <p className="text-6xl font-bold text-(--primary) mb-4">404</p>
        <h1 className="text-2xl font-bold text-(--text-main) mb-2">
          ページが見つかりません
        </h1>
        <p className="text-(--text-sub) mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity"
        >
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
