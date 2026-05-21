"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/invites", label: "招待" },
  { href: "/users", label: "ユーザー" },
  { href: "/subscriptions", label: "プラン" },
  { href: "/offers", label: "オファー" },
  { href: "/stores", label: "店舗" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="admin navigation">
      <ul className="flex flex-wrap items-center gap-1 text-sm">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center rounded-md px-3 py-1.5 transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
