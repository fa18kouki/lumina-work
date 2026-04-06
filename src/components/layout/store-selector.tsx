"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Store, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function StoreSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: stores } = trpc.owner.listStores.useQuery();

  // 現在のURLからstoreIdを抽出
  const storeIdMatch = pathname?.match(/\/o\/stores\/([^/]+)/);
  const currentStoreId = storeIdMatch?.[1];
  const currentStore = stores?.find((s) => s.id === currentStoreId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (!stores || stores.length === 0) return null;

  const handleSelect = (storeId: string) => {
    setOpen(false);
    // 現在のストア配下のページにいる場合は同じサブページに遷移
    if (currentStoreId && pathname) {
      const subPath = pathname.replace(`/o/stores/${currentStoreId}`, "");
      router.push(`/o/stores/${storeId}${subPath}`);
    } else {
      router.push(`/o/stores/${storeId}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-50 text-[var(--text-main)] hover:bg-slate-100 transition-colors border border-gray-200 max-w-[200px]"
      >
        <Store className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="truncate">
          {currentStore ? currentStore.name : "店舗を選択"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleSelect(store.id)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                store.id === currentStoreId
                  ? "bg-slate-50 text-slate-900 font-medium"
                  : "text-[var(--text-sub)] hover:bg-gray-50"
              }`}
            >
              <Store className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{store.name}</p>
                <p className="text-xs text-[var(--text-sub)] truncate">{store.area}</p>
              </div>
              {store.id === currentStoreId && (
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full flex-shrink-0" />
              )}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); router.push("/o/stores/new"); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-sub)] hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              新しい店舗を追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
