export interface DashboardTheme {
  title: string;
  params: {
    area?: string;
    benefit?: string;
  };
}

export const DASHBOARD_THEMES: readonly DashboardTheme[] = [
  { title: "新着の店舗", params: {} },
  { title: "六本木エリアの店舗", params: { area: "六本木" } },
  { title: "銀座エリアの店舗", params: { area: "銀座" } },
  { title: "新宿エリアの店舗", params: { area: "新宿" } },
  { title: "渋谷エリアの店舗", params: { area: "渋谷" } },
  { title: "日払いOKの店舗", params: { benefit: "日払いOK" } },
  { title: "自由出勤できる店舗", params: { benefit: "自由出勤" } },
  { title: "未経験歓迎の店舗", params: { benefit: "未経験歓迎" } },
  { title: "送迎ありの店舗", params: { benefit: "送迎あり" } },
] as const;

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function pickDashboardTheme(
  userId: string | null | undefined,
): DashboardTheme {
  if (!userId) {
    return DASHBOARD_THEMES[0];
  }
  const index = fnv1aHash(userId) % DASHBOARD_THEMES.length;
  return DASHBOARD_THEMES[index];
}
