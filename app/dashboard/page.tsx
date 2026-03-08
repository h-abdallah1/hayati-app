"use client";

import { useClock } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLayout } from "@/lib/layout";
import { formatClock } from "@/lib/time";
import { getHiddenPanels } from "@/lib/modules";
import {
  HeaderBar, PrayerPanel, QuranPanel, ReadingPanel,
  NewsPanel, CalendarPanel,
  GymPanel, FinancePanel, SavingsPanel, FilmsPanel, OverviewPanel, GithubPanel,
} from "@/components/panels";
import { Responsive, useContainerWidth } from "react-grid-layout";
import type { LayoutItem, Layout } from "react-grid-layout";

function HayatiInner() {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const { layout, updateLayout } = useLayout();
  const { width, containerRef, mounted } = useContainerWidth();
  const hiddenPanels = getHiddenPanels(global.disabledModules);
  const show = (id: string) => !hiddenPanels.includes(id);
  const time = useClock();

  const visibleLayout = layout.filter(item => show(item.i));

  const handleLayoutChange = (currentLayout: Layout) => {
    const updated = layout.map(item => {
      const changed = [...currentLayout].find(l => l.i === item.i);
      return changed ?? item;
    });
    updateLayout(updated);
  };

  const PANEL_MAP: Record<string, React.ReactNode> = {
    prayer:   <PrayerPanel time={time} />,
    quran:    <QuranPanel />,
    gym:      <GymPanel />,
    calendar: <CalendarPanel time={time} />,
    finance:  <FinancePanel />,
    savings:  <SavingsPanel />,
    news:     <NewsPanel />,
    reading:  <ReadingPanel />,
    films:    <FilmsPanel />,
    github:   <GithubPanel />,
    overview: <OverviewPanel />,
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:"24px 28px" }}>
      <HeaderBar time={time} />
      <div ref={containerRef} style={{ maxWidth:1280, margin:"0 auto" }}>
        {mounted && (
          <Responsive
            className="hg"
            layouts={{ lg: visibleLayout }}
            breakpoints={{ lg: 1200, md: 768, sm: 480 }}
            cols={{ lg: 4, md: 2, sm: 1 }}
            rowHeight={40}
            margin={[10, 10]}
            containerPadding={[0, 0]}
            dragConfig={{ enabled: true, handle: ".hayati-drag-handle" }}
            resizeConfig={{ enabled: true, handles: ["se"] }}
            onLayoutChange={handleLayoutChange}
            width={width}
          >
            {visibleLayout.map((item: LayoutItem) => (
              <div key={item.i}>{PANEL_MAP[item.i]}</div>
            ))}
          </Responsive>
        )}
      </div>
      <div style={{ maxWidth:1280, margin:"12px auto 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, letterSpacing:"1px" }}>HAYATI v2.0 · حياتي</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>
          {formatClock(time, global.timeFormat)} · {global.location.label}
        </span>
      </div>
    </div>
  );
}

export default function Hayati() { return <HayatiInner />; }
