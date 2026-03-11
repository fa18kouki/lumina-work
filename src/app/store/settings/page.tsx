"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Phone, Shield, Save, Link2 } from "lucide-react";
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

interface ContactInfo {
  contactPhone: string;
  contactEmail: string;
  lineUrl: string;
  preferredContactMethod: "PHONE" | "LINE" | "EMAIL" | null;
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
    key: "systemAnnouncement",
    label: "システムお知らせ",
    description: "サービスの更新やメンテナンス情報を受け取る",
  },
];

const CONTACT_METHODS = [
  { value: "PHONE" as const, label: "電話" },
  { value: "LINE" as const, label: "LINE" },
  { value: "EMAIL" as const, label: "メール" },
];

function isEqual(a: NotificationSettings, b: NotificationSettings) {
  return (Object.keys(a) as (keyof NotificationSettings)[]).every(
    (k) => a[k] === b[k]
  );
}

function isContactEqual(a: ContactInfo, b: ContactInfo) {
  return (
    a.contactPhone === b.contactPhone &&
    a.contactEmail === b.contactEmail &&
    a.lineUrl === b.lineUrl &&
    a.preferredContactMethod === b.preferredContactMethod
  );
}

export default function StoreSettingsPage() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.store.getSettings.useQuery();

  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const [saved, setSaved] = useState(false);

  const [contactDraft, setContactDraft] = useState<ContactInfo | null>(null);
  const [contactSaved, setContactSaved] = useState(false);

  const serverNotifications = settings?.notifications as
    | NotificationSettings
    | undefined;

  const serverContactInfo = settings?.contactInfo as
    | ContactInfo
    | undefined;

  useEffect(() => {
    if (serverNotifications && !draft) {
      setDraft(serverNotifications);
    }
  }, [serverNotifications, draft]);

  useEffect(() => {
    if (serverContactInfo && !contactDraft) {
      setContactDraft(serverContactInfo);
    }
  }, [serverContactInfo, contactDraft]);

  const updateNotifications = trpc.store.updateNotificationSettings.useMutation({
    onSuccess: () => {
      utils.store.getSettings.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateContact = trpc.store.updateContactInfo.useMutation({
    onSuccess: () => {
      utils.store.getSettings.invalidate();
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    },
  });

  if (isLoading || !settings || !draft || !contactDraft) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const account = settings.account;
  const hasChanges = !isEqual(draft, serverNotifications!);
  const hasContactChanges = !isContactEqual(contactDraft, serverContactInfo!);

  const handleToggle = (key: keyof NotificationSettings) => {
    setDraft((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const handleSave = () => {
    updateNotifications.mutate(draft);
  };

  const handleContactSave = () => {
    updateContact.mutate(contactDraft);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">設定</h1>

      {/* 連絡先情報 */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Phone className="w-5 h-5 text-slate-700" />
          <div>
            <h2 className="font-bold text-(--text-main)">連絡先情報</h2>
            <p className="text-xs text-(--text-sub) mt-0.5">
              オファー承諾時にキャストに表示される連絡先です
            </p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--text-main) mb-1">
              電話番号
            </label>
            <input
              type="tel"
              value={contactDraft.contactPhone}
              onChange={(e) =>
                setContactDraft((prev) =>
                  prev ? { ...prev, contactPhone: e.target.value } : prev
                )
              }
              placeholder="03-1234-5678"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-main) mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={contactDraft.contactEmail}
              onChange={(e) =>
                setContactDraft((prev) =>
                  prev ? { ...prev, contactEmail: e.target.value } : prev
                )
              }
              placeholder="contact@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-main) mb-1">
              LINE公式URL
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-sub)" />
              <input
                type="url"
                value={contactDraft.lineUrl}
                onChange={(e) =>
                  setContactDraft((prev) =>
                    prev ? { ...prev, lineUrl: e.target.value } : prev
                  )
                }
                placeholder="https://line.me/R/ti/p/..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-main) mb-1">
              優先連絡方法
            </label>
            <select
              value={contactDraft.preferredContactMethod ?? ""}
              onChange={(e) =>
                setContactDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        preferredContactMethod:
                          (e.target.value as ContactInfo["preferredContactMethod"]) || null,
                      }
                    : prev
                )
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
            >
              <option value="">選択してください</option>
              {CONTACT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          {contactSaved && (
            <span className="text-sm text-green-600 font-medium">
              保存しました
            </span>
          )}
          <button
            type="button"
            onClick={handleContactSave}
            disabled={!hasContactChanges || updateContact.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {updateContact.isPending ? "保存中..." : "連絡先を保存"}
          </button>
        </div>
      </div>

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
