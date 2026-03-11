import { CastNav } from "@/components/layout/cast-nav";
import { NotificationToast } from "@/components/ui/toast-notification";

export default function CastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <CastNav />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">{children}</div>
      </main>
      <NotificationToast />
    </div>
  );
}
