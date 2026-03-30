"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Building2, Bell } from "lucide-react";
import { useOwnerSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";

export function OwnerTopbar() {
  const { user } = useOwnerSession();
  const { data: ownerProfile } = trpc.owner.getProfile.useQuery(undefined, {
    enabled: !!user,
  });
  const displayName = ownerProfile?.companyName ?? "オーナー";

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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 sm:h-[70px] bg-white flex items-center justify-between px-4 sm:px-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] z-[1000]">
      <Link href="/o/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <img src="/Favicon_16x16.png" alt="" className="w-6 h-6 rounded object-contain" aria-hidden />
        <span className="text-base font-medium text-[var(--text-sub)] tracking-wide">
          オーナー管理
        </span>
      </Link>

      <div className="hidden sm:flex items-center gap-5 text-[var(--text-sub)] bg-[var(--bg-gray)] px-5 py-2 rounded-md font-medium text-base">
        <Building2 className="w-4 h-4" aria-hidden />
        {displayName}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative text-[var(--text-sub)] hover:text-slate-700 transition-colors p-1"
            aria-label="通知"
          >
            <Bell className="w-[22px] h-[22px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
