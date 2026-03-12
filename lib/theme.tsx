"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { C_DARK, C_LIGHT, ACCENT_THEMES } from "./design";
import { useGlobalSettings } from "./settings";

const ThemeContext = createContext<typeof C_DARK>(C_DARK);
const ToggleContext = createContext<{ isDark: boolean; toggle: () => void }>({ isDark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const { global } = useGlobalSettings();

  useEffect(() => {
    const stored = localStorage.getItem("hayati-dark");
    if (stored !== null) setIsDark(stored === "true");
  }, []);

  const theme = ACCENT_THEMES.find(t => t.name === global.accentTheme) ?? ACCENT_THEMES[0];
  const accent = isDark ? theme.dark : theme.light;
  const palette = {
    ...(isDark ? C_DARK : C_LIGHT),
    accent,
    accentDim: accent + "22",
    accentMid: accent + "55",
  };

  const toggle = useCallback(() => setIsDark(d => {
    const next = !d;
    localStorage.setItem("hayati-dark", String(next));
    return next;
  }), []);
  const toggleValue = useMemo(() => ({ isDark, toggle }), [isDark, toggle]);
  return (
    <ToggleContext.Provider value={toggleValue}>
      <ThemeContext.Provider value={palette}>
        {children}
      </ThemeContext.Provider>
    </ToggleContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeToggle() {
  return useContext(ToggleContext);
}
