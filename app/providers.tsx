"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

function StoreSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch("/api/store")
      .then(r => r.json())
      .then((rows: { key: string; value: string }[]) => {
        for (const { key, value } of rows) {
          try { localStorage.setItem(key, value); } catch {}
        }
      })
      .catch(() => {});
  }, []);
  return <>{children}</>;
}
import { GlobalSettingsProvider, PanelSettingsProvider } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme";
import { LayoutProvider } from "@/lib/layout";
import { SearchPalette } from "@/components/SearchPalette";
import { Ticker } from "@/components/Ticker";
import { AssistantDrawer } from "@/components/AssistantDrawer";

type AssistantCtx = { open: boolean; toggle: () => void; setOpen: (v: boolean) => void };

const AssistantContext = createContext<AssistantCtx>({
  open: false,
  toggle: () => {},
  setOpen: () => {},
});

export function useAssistant() {
  return useContext(AssistantContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <StoreSyncProvider>
    <GlobalSettingsProvider>
      <PanelSettingsProvider>
        <LayoutProvider>
          <ThemeProvider>
            <AssistantContext.Provider value={{
              open: assistantOpen,
              toggle: () => setAssistantOpen(v => !v),
              setOpen: setAssistantOpen,
            }}>
              {children}
              <SearchPalette />
              <Ticker />
              <AssistantDrawer
                open={assistantOpen}
                onClose={() => setAssistantOpen(false)}
              />
            </AssistantContext.Provider>
          </ThemeProvider>
        </LayoutProvider>
      </PanelSettingsProvider>
    </GlobalSettingsProvider>
    </StoreSyncProvider>
  );
}
