"use client";

import { SettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SettingsProvider>
  );
}
