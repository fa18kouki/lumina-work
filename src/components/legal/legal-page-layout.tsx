import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/lp/Footer";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            トップページに戻る
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
          {title}
        </h1>
        <p className="text-sm text-[var(--text-sub)] mb-10">
          最終更新日: {lastUpdated}
        </p>

        <div className="prose prose-gray max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-main)] [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--text-main)] [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--text-main)] [&_p]:mb-4 [&_ul]:text-sm [&_ul]:text-[var(--text-main)] [&_ul]:mb-4 [&_ul]:pl-6 [&_li]:mb-1 [&_ol]:text-sm [&_ol]:text-[var(--text-main)] [&_ol]:mb-4 [&_ol]:pl-6">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
