"use client";

import { GlobalSettingsProvider, PanelSettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";
import { SearchPalette } from "@/components/SearchPalette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSettingsProvider>
      <PanelSettingsProvider>
        <ThemeProvider>
          {children}
          <SearchPalette />
        </ThemeProvider>
      </PanelSettingsProvider>
    </GlobalSettingsProvider>
  );
}
