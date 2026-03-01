"use client";

import { useState } from "react";
import { useClock } from "@/lib/hooks";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { SettingsProvider, useSettings } from "@/lib/settings";
import {
  HeaderBar, FocusPanel, TasksPanel, StatusPanel, PrayerPanel,
  NewsPanel, HabitsPanel, QuranPanel, CurrentReadsPanel,
  ReadingListPanel, CalendarPanel,
} from "@/components/panels";
import { SettingsDrawer } from "@/components/SettingsDrawer";

function HayatiInner() {
  const C = useTheme();
  const { settings } = useSettings();
  const time = useClock();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"24px 28px" }}>
      <HeaderBar time={time} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="hg" style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridAutoRows:"auto", gap:12 }}>
        <FocusPanel />
        <TasksPanel />
        <StatusPanel time={time} />
        <PrayerPanel time={time} />
        <NewsPanel />
        <HabitsPanel time={time} />
        <QuranPanel />
        <CurrentReadsPanel />
        <ReadingListPanel />
        <CalendarPanel time={time} />
      </div>
      <div style={{ maxWidth:1280, margin:"12px auto 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, letterSpacing:"1px" }}>HAYATI v2.0 · حياتي</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>
          {time.getHours().toString().padStart(2,"0")}:{time.getMinutes().toString().padStart(2,"0")} · {settings.location.label}
        </span>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function Hayati() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <HayatiInner />
      </ThemeProvider>
    </SettingsProvider>
  );
}
