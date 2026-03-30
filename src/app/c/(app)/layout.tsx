import { CastNav } from "@/components/layout/cast-nav";
import { NotificationToast } from "@/components/ui/toast-notification";

export default function CastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-gray-50 relative">
        <main className="pb-20">
          <div className="p-4">{children}</div>
        </main>
        <CastNav />
        <NotificationToast />
      </div>
    </div>
  );
}
