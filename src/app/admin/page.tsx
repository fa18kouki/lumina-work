import { redirect } from "next/navigation";

// middleware が `/` (= rewrite 後の /admin) を /invites or /login にリダイレクトする。
// 念のためサーバ側でも `/login` にフォールバック。
export default function AdminIndexPage() {
  redirect("/login");
}
