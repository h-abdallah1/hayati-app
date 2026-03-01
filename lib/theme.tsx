"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { C_DARK, C_LIGHT } from "./design";

const ThemeContext = createContext<typeof C_DARK>(C_DARK);
const ToggleContext = createContext<{ isDark: boolean; toggle: () => void }>({ isDark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("hayati-dark");
    if (stored !== null) setIsDark(stored === "true");
  }, []);

  const palette = isDark ? C_DARK : C_LIGHT;
  const toggle = () => setIsDark(d => {
    const next = !d;
    localStorage.setItem("hayati-dark", String(next));
    return next;
  });
  return (
    <ToggleContext.Provider value={{ isDark, toggle }}>
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
