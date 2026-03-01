"use client";

import { GlobalSettingsProvider, PanelSettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSettingsProvider>
      <PanelSettingsProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </PanelSettingsProvider>
    </GlobalSettingsProvider>
  );
}
