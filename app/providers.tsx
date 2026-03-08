"use client";

import { useState, useEffect } from "react";
import { GlobalSettingsProvider, PanelSettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";
import { LayoutProvider } from "@/lib/layout";
import { SearchPalette } from "@/components/SearchPalette";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { Ticker } from "@/components/Ticker";

function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener("hayati:open-settings", handler);
    return () => window.removeEventListener("hayati:open-settings", handler);
  }, []);

  return (
    <>
      {children}
      <SearchPalette />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Ticker />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSettingsProvider>
      <PanelSettingsProvider>
        <LayoutProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </LayoutProvider>
      </PanelSettingsProvider>
    </GlobalSettingsProvider>
  );
}
