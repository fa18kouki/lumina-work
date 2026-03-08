"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Phone, Shield, Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { trpc } from "@/lib/trpc";

interface NotificationSettings {
  newApplicant: boolean;
  offerResponse: boolean;
  interviewReminder: boolean;
  messageReceived: boolean;
  systemAnnouncement: boolean;
}

const NOTIFICATION_ITEMS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "newApplicant",
    label: "新規応募通知",
    description: "新しい応募があった時に通知を受け取る",
  },
  {
    key: "offerResponse",
    label: "オファー回答通知",
    description: "キャストがオファーに回答した時に通知を受け取る",
  },
  {
    key: "interviewReminder",
    label: "面接リマインダー",
    description: "面接予定の前日にリマインダーを受け取る",
  },
  {
    key: "messageReceived",
    label: "メッセージ受信通知",
    description: "新しいメッセージを受信した時に通知を受け取る",
  },
  {
    key: "systemAnnouncement",
    label: "システムお知らせ",
    description: "サービスの更新やメンテナンス情報を受け取る",
  },
];

function isEqual(a: NotificationSettings, b: NotificationSettings) {
  return (Object.keys(a) as (keyof NotificationSettings)[]).every(
    (k) => a[k] === b[k]
  );
}

export default function StoreSettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.store.getSettings.useQuery();

  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const [saved, setSaved] = useState(false);

  const serverNotifications = settings?.notifications as
    | NotificationSettings
    | undefined;

  useEffect(() => {
    if (serverNotifications && !draft) {
      setDraft(serverNotifications);
    }
  }, [serverNotifications, draft]);

  const updateNotifications = trpc.store.updateNotificationSettings.useMutation({
    onSuccess: () => {
      utils.store.getSettings.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading || !settings || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const account = settings.account;
  const hasChanges = !isEqual(draft, serverNotifications!);

  const handleToggle = (key: keyof NotificationSettings) => {
    setDraft((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const handleSave = () => {
    updateNotifications.mutate(draft);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">設定</h1>

      {/* 通知設定 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Bell className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-(--text-main)">通知設定</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-(--text-main)">
                  {item.label}
                </p>
                <p className="text-xs text-(--text-sub) mt-0.5">
                  {item.description}
                </p>
              </div>
              <ToggleSwitch
                checked={draft[item.key]}
                onChange={() => handleToggle(item.key)}
                label={item.label}
              />
            </div>
          ))}
        </div>

        {/* 保存ボタン */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              保存しました
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || updateNotifications.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {updateNotifications.isPending ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </div>

      {/* アカウント情報 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Shield className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-(--text-main)">アカウント情報</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail className="w-4 h-4 text-(--text-sub)" />
            <div>
              <p className="text-xs text-(--text-sub)">メールアドレス</p>
              <p className="text-sm font-medium text-(--text-main)">
                {account.email || "未設定"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Phone className="w-4 h-4 text-(--text-sub)" />
            <div>
              <p className="text-xs text-(--text-sub)">電話番号</p>
              <p className="text-sm font-medium text-(--text-main)">
                {account.phone || "未設定"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
