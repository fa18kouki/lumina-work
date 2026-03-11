"use client";

import { Plus, Trash2 } from "lucide-react";

interface WorkHistory {
  storeName: string;
  hourlyRate: number | null;
  monthlySales: number | null;
  durationMonths: number | null;
  exitDate: string;
  exitReason: string;
  notes: string;
}

interface Props {
  data: WorkHistory[];
  onChange: (histories: WorkHistory[]) => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

function emptyHistory(): WorkHistory {
  return {
    storeName: "",
    hourlyRate: null,
    monthlySales: null,
    durationMonths: null,
    exitDate: "",
    exitReason: "",
    notes: "",
  };
}

export function WorkHistorySection({ data, onChange }: Props) {
  const addHistory = () => {
    onChange([...data, emptyHistory()]);
  };

  const removeHistory = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateHistory = (
    index: number,
    field: keyof WorkHistory,
    value: unknown
  ) => {
    const updated = data.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-base font-semibold text-(--text-main)">職歴</h3>
        <button
          type="button"
          onClick={addHistory}
          className="flex items-center gap-1 text-sm text-(--primary) hover:text-(--primary)/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-(--text-sub)">
          <p className="text-sm mb-2">職歴が登録されていません</p>
          <button
            type="button"
            onClick={addHistory}
            className="text-sm text-(--primary) hover:underline"
          >
            職歴を追加する
          </button>
        </div>
      )}

      {data.map((history, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-lg p-4 space-y-4 relative"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-(--text-main)">
              職歴 {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeHistory(index)}
              className="text-(--text-sub) hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                店舗名 *
              </label>
              <input
                type="text"
                className={inputClass}
                value={history.storeName}
                onChange={(e) =>
                  updateHistory(index, "storeName", e.target.value)
                }
                placeholder="店舗名"
              />
            </div>

            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                時給
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={inputClass}
                  value={history.hourlyRate ?? ""}
                  onChange={(e) =>
                    updateHistory(
                      index,
                      "hourlyRate",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  min={0}
                />
                <span className="text-xs text-(--text-sub)">円</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                月間売上
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={inputClass}
                  value={history.monthlySales ?? ""}
                  onChange={(e) =>
                    updateHistory(
                      index,
                      "monthlySales",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  min={0}
                />
                <span className="text-xs text-(--text-sub)">円</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                在籍期間
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={inputClass}
                  value={history.durationMonths ?? ""}
                  onChange={(e) =>
                    updateHistory(
                      index,
                      "durationMonths",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  min={0}
                />
                <span className="text-xs text-(--text-sub)">ヶ月</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                退店時期
              </label>
              <input
                type="text"
                className={inputClass}
                value={history.exitDate}
                onChange={(e) =>
                  updateHistory(index, "exitDate", e.target.value)
                }
                placeholder="2024年3月"
              />
            </div>

            <div>
              <label className="block text-xs text-(--text-sub) mb-1">
                退店理由
              </label>
              <input
                type="text"
                className={inputClass}
                value={history.exitReason}
                onChange={(e) =>
                  updateHistory(index, "exitReason", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-(--text-sub) mb-1">
              備考
            </label>
            <textarea
              className={`${inputClass} min-h-[50px]`}
              value={history.notes}
              onChange={(e) => updateHistory(index, "notes", e.target.value)}
              placeholder="特記事項があれば記入"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
