"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "dark" | "light" | "auto";

const STORAGE_KEY = "remind-theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored === "dark" || stored === "light" || stored === "auto") setThemeState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light", "auto-theme");
    if (theme === "dark") root.classList.add("theme-dark");
    else if (theme === "light") root.classList.add("theme-light");
    else root.classList.add("auto-theme");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (t: ThemeId) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ?? { theme: "dark" as ThemeId, setTheme: () => {} };
}
