"use client";

import { useState } from "react";
import { Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface ScheduleInterviewDialogProps {
  open: boolean;
  offerId: string;
  storeName?: string;
  castNickname?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScheduleInterviewDialog({
  open,
  offerId,
  storeName,
  castNickname,
  onClose,
  onSuccess,
}: ScheduleInterviewDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const scheduleMutation = trpc.interview.schedule.useMutation({
    onSuccess: () => {
      utils.interview.getInterviews.invalidate();
      utils.cast.getOffers.invalidate();
      utils.store.getSentOffers.invalidate();
      onSuccess?.();
      handleClose();
    },
  });

  if (!open) return null;

  const handleClose = () => {
    setDate("");
    setTime("");
    setNotes("");
    onClose();
  };

  const handleSubmit = () => {
    if (!date || !time) return;

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    scheduleMutation.mutate({
      offerId,
      scheduledAt,
      ...(notes && { notes }),
    });
  };

  const isValid = date && time;
  const title = castNickname
    ? `${castNickname}さんとの面接を設定`
    : storeName
      ? `${storeName}との面接を設定`
      : "面接日時を設定";

  // 今日以降の日付のみ選択可能
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-sub)] mb-5">
          面接の日時を選択してください
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-2" />
            <div className="flex-1">
              <Input
                type="date"
                label="面接日"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-2" />
            <div className="flex-1">
              <Input
                type="time"
                label="面接時刻"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-2" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備考（任意）
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
                placeholder="面接に関するメモがあれば入力してください"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {scheduleMutation.error && (
          <p className="text-sm text-red-600 mt-3">
            {scheduleMutation.error.message}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[var(--text-sub)] hover:bg-gray-50 transition-colors"
          >
            スキップ
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            isLoading={scheduleMutation.isPending}
            className="flex-1"
          >
            面接を設定
          </Button>
        </div>
      </div>
    </div>
  );
}
