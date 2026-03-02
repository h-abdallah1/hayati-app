"use client";

import { useState } from "react";
import { useClock } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings, usePanelSettings } from "@/lib/settings";
import { formatClock } from "@/lib/time";
import {
  HeaderBar, FocusPanel, TasksPanel, TimePanel, ReadingPanel,
  NewsPanel, QuranPanel, CalendarPanel, WeatherPanel,
  GymPanel, FinancePanel,
} from "@/components/panels";
import { SettingsDrawer } from "@/components/SettingsDrawer";

function HayatiInner() {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const { panels } = usePanelSettings();
  const show = (id: string) => !panels.hiddenPanels.includes(id);
  const time = useClock();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"24px 28px" }}>
      <HeaderBar time={time} onOpenSettings={() => setSettingsOpen(true)} />
      <div className="hg" style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridAutoRows:"auto", gap:12 }}>
        {show("focus")   && <FocusPanel />}
        {show("tasks")   && <TasksPanel />}
        {show("time")    && <TimePanel time={time} />}
        {show("news")    && <NewsPanel />}
        {show("quran")   && <QuranPanel />}
        {show("reading") && <ReadingPanel />}
        {show("calendar")&& <CalendarPanel time={time} />}
        {show("weather") && <WeatherPanel />}
        {show("gym")     && <GymPanel />}
        {show("finance") && <FinancePanel />}
      </div>
      <div style={{ maxWidth:1280, margin:"12px auto 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, letterSpacing:"1px" }}>HAYATI v2.0 · حياتي</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>
          {formatClock(time, global.timeFormat)} · {global.location.label}
        </span>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function Hayati() {
  return <HayatiInner />;
}
