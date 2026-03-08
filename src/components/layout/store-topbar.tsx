"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Store, Bell } from "lucide-react";
import { useStoreSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    message: "あいり さんがオファーを承諾しました",
    time: "5分前",
    unread: true,
  },
  {
    id: "n2",
    message: "新しい応募が届きました",
    time: "30分前",
    unread: true,
  },
  {
    id: "n3",
    message: "明日14:00に面接が予定されています",
    time: "1時間前",
    unread: false,
  },
  {
    id: "n4",
    message: "みさき さんからメッセージが届きました",
    time: "3時間前",
    unread: false,
  },
];

export function StoreTopbar() {
  const { user } = useStoreSession();
  const { data: storeProfile } = trpc.store.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const storeDisplayName = storeProfile?.name ?? "店舗";

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 sm:h-[70px] bg-white flex items-center justify-between px-4 sm:px-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] z-[1000]">
      <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <img src="/Favicon_16x16.png" alt="" className="w-6 h-6 rounded object-contain" aria-hidden />
        <span className="text-base font-medium text-[var(--text-sub)] tracking-wide">
          管理画面
        </span>
      </Link>

      <div className="hidden sm:flex items-center gap-5 text-[var(--text-sub)] bg-[var(--bg-gray)] px-5 py-2 rounded-md font-medium text-base">
        <Store className="w-4 h-4" aria-hidden />
        {storeDisplayName}
      </div>

      <div className="flex items-center gap-5">
        {/* 通知ベル */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative text-[var(--text-sub)] hover:text-slate-700 transition-colors p-1"
            aria-label="通知"
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-slate-700 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[var(--text-main)]">通知</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                    {unreadCount}件の未読
                  </span>
                )}
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                      n.unread ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <span className="w-2 h-2 bg-slate-700 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className={n.unread ? "" : "ml-4"}>
                        <p className="text-sm text-[var(--text-main)]">{n.message}</p>
                        <p className="text-xs text-[var(--text-sub)] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
