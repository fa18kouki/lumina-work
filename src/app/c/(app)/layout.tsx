import { CastNav } from "@/components/layout/cast-nav";
import { NotificationToast } from "@/components/ui/toast-notification";

export default function CastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-md h-screen max-h-[844px] bg-gray-50 relative flex flex-col rounded-2xl overflow-hidden shadow-xl">
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">{children}</div>
        </main>
        <CastNav />
        <NotificationToast />
      </div>
    </div>
  );
}
