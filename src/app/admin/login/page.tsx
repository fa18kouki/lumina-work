import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">ログイン</h2>
        <p className="text-sm text-slate-600">
          ADMIN_API_KEY を入力してください。セッションは 24 時間保持されます。
        </p>
      </header>
      <AdminLoginForm />
    </section>
  );
}
