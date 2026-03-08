"use client";

import { GlobalSettingsProvider, PanelSettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";
import { LayoutProvider } from "@/lib/layout";
import { SearchPalette } from "@/components/SearchPalette";
import { Ticker } from "@/components/Ticker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSettingsProvider>
      <PanelSettingsProvider>
        <LayoutProvider>
          <ThemeProvider>
            {children}
            <SearchPalette />
            <Ticker />
          </ThemeProvider>
        </LayoutProvider>
      </PanelSettingsProvider>
    </GlobalSettingsProvider>
  );
}
