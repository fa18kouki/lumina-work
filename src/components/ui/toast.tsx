"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast, type Toast, type ToastType } from "@/lib/toast-provider";

const TOAST_STYLES: Record<
  ToastType,
  { icon: typeof CheckCircle; iconBg: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  return (
    <div
      className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 min-w-[280px] max-w-[400px]"
      style={{ animation: "toast-slide-in 300ms ease-out" }}
    >
      <div
        className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
      </div>
      <span className="text-sm font-medium text-gray-900 flex-1">
        {toast.message}
      </span>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>,
    document.body
  );
}
