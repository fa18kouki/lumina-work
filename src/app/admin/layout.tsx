import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "LUMINA Admin",
  description: "LUMINA 管理画面",
  robots: { index: false, follow: false },
};

async function isAuthenticated(): Promise<boolean> {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  const store = await cookies();
  const value = store.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionCookie(value, expected).ok;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              LUMINA Admin
            </h1>
            <span className="text-xs text-slate-500">internal use only</span>
          </div>
          {authed ? <AdminLogoutButton /> : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
