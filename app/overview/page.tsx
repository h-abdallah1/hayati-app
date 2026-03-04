"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import type { ObsidianFile } from "@/app/api/obsidian/files/route";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import {
  buildYearDays,
  mergeActivities,
  buildActivityFeed,
  toDateKey,
  formatDateShort,
  formatDateFull,
  getMonthStartCols,
  type ActivityCategory,
} from "./helpers";

const CELL = 18;
const GAP = 3;
const STRIP_H = 5;
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const CAT_COLORS: Record<ActivityCategory, string> = {
  gym: "#4a9eff",
  film: "#ff6b6b",
  note: "#f5a623",
};

const CAT_LABELS: Record<ActivityCategory, string> = {
  gym: "Gym",
  film: "Film",
  note: "Note",
};

const ORDERED_CATS: ActivityCategory[] = ["gym", "film", "note"];

export default function OverviewPage() {
  const C = useTheme();
  const { global: settings } = useGlobalSettings();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Data
  const [gymWorkouts, setGymWorkouts] = useState<HevyWorkoutFull[]>([]);
  const [obsidianFiles, setObsidianFiles] = useState<ObsidianFile[]>([]);
  const [gymLoading, setGymLoading] = useState(false);
  const [obsidianLoading, setObsidianLoading] = useState(false);
  const { films } = useLetterboxd(settings.letterboxdUsername);

  // Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; dateKey: string } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Fetch gym
  useEffect(() => {
    setGymLoading(true);
    setGymWorkouts([]);
    fetch(`/api/hevy/workouts?year=${year}`)
      .then(r => r.json())
      .then(d => setGymWorkouts(d.workouts ?? []))
      .catch(() => {})
      .finally(() => setGymLoading(false));
  }, [year]);

  // Fetch obsidian
  useEffect(() => {
    if (!settings.obsidianVaultPath) { setObsidianFiles([]); return; }
    setObsidianLoading(true);
    setObsidianFiles([]);
    fetch(`/api/obsidian/files?vault=${encodeURIComponent(settings.obsidianVaultPath)}`)
      .then(r => r.json())
      .then(d => setObsidianFiles(d.files ?? []))
      .catch(() => {})
      .finally(() => setObsidianLoading(false));
  }, [year, settings.obsidianVaultPath]);

  // Derive date keys for the selected year
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const gymDates = gymWorkouts
    .filter(w => w.date >= yearStart && w.date < yearEnd)
    .map(w => w.date);

  const filmDates = films
    .filter(f => f.watchedDate >= yearStart && f.watchedDate < yearEnd)
    .map(f => f.watchedDate);

  const noteDates = obsidianFiles
    .map(f => {
      const d = new Date(f.mtime);
      return toDateKey(d);
    })
    .filter(d => d >= yearStart && d < yearEnd);

  const activityMap = mergeActivities(gymDates, filmDates, noteDates);

  // Feed detail records
  const gymDetailMap = new Map<string, string>();
  for (const w of gymWorkouts) {
    if (w.date >= yearStart && w.date < yearEnd) {
      const prev = gymDetailMap.get(w.date);
      gymDetailMap.set(w.date, prev ? `${prev}, ${w.title}` : `${w.title} · ${w.duration}m`);
    }
  }

  const filmDetailMap = new Map<string, string[]>();
  for (const f of films) {
    if (f.watchedDate >= yearStart && f.watchedDate < yearEnd) {
      if (!filmDetailMap.has(f.watchedDate)) filmDetailMap.set(f.watchedDate, []);
      const stars = f.rating ? "★".repeat(Math.floor(f.rating)) + (f.rating % 1 >= 0.5 ? "½" : "") : "";
      filmDetailMap.get(f.watchedDate)!.push(`${f.title}${stars ? ` ${stars}` : ""}`);
    }
  }

  const noteDetailMap = new Map<string, string[]>();
  for (const f of obsidianFiles) {
    const d = toDateKey(new Date(f.mtime));
    if (d >= yearStart && d < yearEnd) {
      if (!noteDetailMap.has(d)) noteDetailMap.set(d, []);
      noteDetailMap.get(d)!.push(f.name);
    }
  }

  const gymDetails = [...gymDetailMap.entries()].map(([date, label]) => ({ date, label }));
  const filmDetails = [...filmDetailMap.entries()].flatMap(([date, titles]) =>
    titles.map(label => ({ date, label }))
  );
  const noteDetails = [...noteDetailMap.entries()].flatMap(([date, names]) =>
    names.map(label => ({ date, label }))
  );

  const feedEntries = buildActivityFeed(activityMap, gymDetails, filmDetails, noteDetails);

  // Grid construction
  const days = buildYearDays(year);
  const jan1 = new Date(year, 0, 1);
  const jan1dow = (jan1.getDay() + 6) % 7; // Mon=0
  const totalCols = Math.ceil((days.length + jan1dow) / 7);
  const monthCols = getMonthStartCols(year);

  // Scroll to date in feed
  const scrollToDate = useCallback((dateKey: string) => {
    if (!feedRef.current) return;
    const el = feedRef.current.querySelector(`[data-date="${dateKey}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const loading = gymLoading || obsidianLoading;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "'JetBrains Mono', monospace",
      paddingLeft: 72,
      paddingRight: 32,
      paddingTop: 32,
      paddingBottom: 64,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em", color: C.text }}>
          OVERVIEW
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setYear(y => y - 1)}
            style={{ ...btnStyle(C), paddingInline: 10 }}
          >
            ←
          </button>
          <span style={{ fontSize: 13, color: C.textMuted, minWidth: 36, textAlign: "center" }}>{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            style={{ ...btnStyle(C), paddingInline: 10, opacity: year >= currentYear ? 0.3 : 1 }}
          >
            →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "center" }}>
        {ORDERED_CATS.map(cat => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[cat] }} />
            {CAT_LABELS[cat]}
          </div>
        ))}
        {loading && (
          <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 8 }}>loading…</span>
        )}
      </div>

      {/* Year Grid */}
      <div style={{ overflowX: "auto", marginBottom: 40 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Month labels */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `28px repeat(${totalCols}, ${CELL}px)`,
            gap: `0 ${GAP}px`,
            marginBottom: 4,
          }}>
            <div />
            {Array.from({ length: totalCols }, (_, col) => {
              const mc = monthCols.find(m => m.col === col);
              return (
                <div key={col} style={{
                  fontSize: 10,
                  color: mc ? C.textMuted : "transparent",
                  whiteSpace: "nowrap",
                  overflow: "visible",
                  userSelect: "none",
                }}>
                  {mc?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Grid rows (7 rows = Mon–Sun) */}
          {DOW_LABELS.map((dow, rowIdx) => (
            <div key={rowIdx} style={{
              display: "grid",
              gridTemplateColumns: `28px repeat(${totalCols}, ${CELL}px)`,
              gap: `${GAP}px`,
              marginBottom: rowIdx === 6 ? 0 : 0,
            }}>
              {/* Day-of-week label */}
              <div style={{
                fontSize: 10,
                color: C.textFaint,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 4,
                userSelect: "none",
                height: CELL,
              }}>
                {rowIdx % 2 === 0 ? dow : ""}
              </div>

              {Array.from({ length: totalCols }, (_, colIdx) => {
                const dayIndex = colIdx * 7 + rowIdx - jan1dow;
                if (dayIndex < 0 || dayIndex >= days.length) {
                  return <div key={colIdx} style={{ width: CELL, height: CELL }} />;
                }
                const date = days[dayIndex];
                const dateKey = toDateKey(date);
                const cats = activityMap.get(dateKey);
                const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
                const hasActivity = activeCats.length > 0;
                const isToday = dateKey === toDateKey(new Date());

                return (
                  <div
                    key={colIdx}
                    title={dateKey}
                    onClick={() => hasActivity && scrollToDate(dateKey)}
                    onMouseEnter={e => {
                      if (hasActivity) {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 4, dateKey });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: hasActivity ? C.surfaceHi : C.surface,
                      border: isToday ? `1px solid ${C.accentMid}` : `1px solid ${C.border}`,
                      cursor: hasActivity ? "pointer" : "default",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    {activeCats.map(cat => (
                      <div
                        key={cat}
                        style={{
                          width: "100%",
                          height: STRIP_H,
                          background: CAT_COLORS[cat],
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

      {/* Activity Feed */}
      <div ref={feedRef}>
        <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 16, letterSpacing: "0.06em" }}>
          ACTIVITY FEED
        </div>
        {feedEntries.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textFaint }}>No activity recorded for {year}.</div>
        ) : (
          feedEntries.map(entry => (
            <div
              key={entry.date}
              data-date={entry.date}
              style={{ marginBottom: 20 }}
            >
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>
                {formatDateFull(entry.date)}
              </div>
              {entry.items.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12,
                  color: C.text,
                  paddingLeft: 8,
                  marginBottom: 3,
                }}>
                  <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: CAT_COLORS[item.category],
                    marginTop: 3,
                    flexShrink: 0,
                  }} />
                  <span style={{ color: CAT_COLORS[item.category], marginRight: 4 }}>
                    {CAT_LABELS[item.category]}
                  </span>
                  <span style={{ color: C.textMuted }}>—</span>
                  <span style={{ color: C.text }}>{item.label}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (() => {
        const cats = activityMap.get(tooltip.dateKey);
        const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
        return (
          <div style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 5,
            padding: "6px 10px",
            fontSize: 11,
            color: C.text,
            zIndex: 999,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            minWidth: 120,
          }}>
            <div style={{ color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>
              {formatDateShort(tooltip.dateKey)}
            </div>
            {activeCats.map(cat => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat] }} />
                <span style={{ color: CAT_COLORS[cat] }}>{CAT_LABELS[cat]}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function btnStyle(C: ReturnType<typeof useTheme>) {
  return {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.textMuted,
    borderRadius: 5,
    padding: "3px 8px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
  } as const;
}
