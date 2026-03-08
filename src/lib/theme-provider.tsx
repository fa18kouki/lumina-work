"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
});

// 常にライトテーマを使用
function getThemeByTime(): Theme {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // 常にライトテーマ
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // クライアントサイドで時間に基づいてテーマを設定
    setTheme(getThemeByTime());
    setMounted(true);

    // 1分ごとにテーマをチェック（時間帯の境界を跨ぐ場合に対応）
    const interval = setInterval(() => {
      setTheme(getThemeByTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentTheme = mounted ? theme : "light";

  return (
    <ThemeContext.Provider
      value={{ theme: currentTheme, isDark: currentTheme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
