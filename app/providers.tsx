"use client";

import React, { createContext, useContext, useState } from "react";
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
  );
}
