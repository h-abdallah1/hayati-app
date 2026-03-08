"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings, usePanelSettings } from "@/lib/settings";
import { useNews } from "@/lib/hooks/useNews";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { getPrayerTimes } from "@/lib/hooks/getPrayerTimes";
import { useClock } from "@/lib/hooks";
import { load as loadGoals, goalYear } from "@/lib/goals";

const TICKER_H = 28;
const SEP = "   ·   ";

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function dayOfYear(d: Date) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

export function Ticker() {
  const C = useTheme();
  const { global: settings } = useGlobalSettings();
  const { panels } = usePanelSettings();
  const now = useClock();

  const { items: news } = useNews(panels.newsFeeds);
  const { events } = useCalendarEvents(panels.calendarFeeds);

  const [activeGoals, setActiveGoals] = useState<string[]>([]);
  const year = now.getFullYear();
  useEffect(() => {
    const all = loadGoals().filter(g => goalYear(g) === year && g.status === "active");
    setActiveGoals(all.map(g => g.title));
  }, [year]);

  if (!settings.showTicker) return null;

  // ── Year stats ─────────────────────────────────────────────────────────────
  const leap    = isLeapYear(year);
  const total   = leap ? 366 : 365;
  const today   = dayOfYear(now);
  const pct     = ((today / total) * 100).toFixed(1);
  const jan1DOW = new Date(year, 0, 1).getDay();
  const week    = Math.ceil((today + jan1DOW) / 7);
  const quarter = Math.ceil((now.getMonth() + 1) / 3);

  // ── Next prayer + countdown ────────────────────────────────────────────────
  const prayers  = getPrayerTimes(settings.location, settings.timeFormat, settings.prayerMethod);
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const next     = prayers.find(p => p.mins > nowMins) ?? prayers[0];
  const until    = next ? (next.mins > nowMins ? next.mins - nowMins : next.mins + 1440 - nowMins) : 0;
  const countdown = until >= 60 ? `${Math.floor(until / 60)}h ${until % 60}m` : `${until}m`;

  // ── Calendar: upcoming events ──────────────────────────────────────────────
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const upcomingEvents = events
    .filter(e => e.date >= todayKey)
    .slice(0, 4)
    .map(e => {
      const isToday = e.date === todayKey;
      const d = new Date(e.date + "T00:00:00");
      const when = isToday
        ? "today"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return `${e.label} (${when})`;
    });

  // ── Build items ────────────────────────────────────────────────────────────
  const items: string[] = [
    `${year} · Day ${today}/${total} · Week ${week} · Q${quarter} · ${pct}%`,
    next ? `${next.name} at ${next.time} · in ${countdown}` : null,
    ...upcomingEvents,
    ...activeGoals.slice(0, 4).map(g => `◑ ${g}`),
    ...news.slice(0, 10).map(n => n.title),
  ].filter(Boolean) as string[];

  const content = items.join(SEP);
  // Duration: ~60 chars per second feels right
  const duration = Math.max(20, Math.round(content.length / 5));

  return (
    <>
      <style>{`
        @keyframes hayati-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 56,
        right: 0,
        height: TICKER_H,
        background: C.bg,
        borderTop: `1px solid ${C.border}`,
        overflow: "hidden",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          animation: `hayati-ticker ${duration}s linear infinite`,
          willChange: "transform",
        }}>
          {/* Duplicate for seamless loop */}
          {[0, 1].map(i => (
            <span key={i} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: C.textFaint,
              letterSpacing: "0.3px",
            }}>
              {content}{SEP}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
