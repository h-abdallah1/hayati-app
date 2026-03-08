"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Dumbbell, Clapperboard, FileText, Target } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { Panel, Tag } from "@/components/ui";
import { load as loadGoals, goalYear } from "@/lib/goals";
import {
  buildYearDays, mergeActivities, toDateKey, getMonthStartCols,
  type ActivityCategory,
} from "@/app/overview/helpers";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";

const CAT_COLORS: Record<ActivityCategory, string> = {
  gym:  "#4a9eff",
  film: "#ff6b6b",
  note: "#f5a623",
};

const CAT_ICONS = {
  gym:  Dumbbell,
  film: Clapperboard,
  note: FileText,
} as const;

const ORDERED_CATS: ActivityCategory[] = ["gym", "film", "note"];
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DOW_W = 20; // px for day-label column
const GAP   = 3;

export function OverviewPanel() {
  const C = useTheme();
  const { global: settings } = useGlobalSettings();
  const { films } = useLetterboxd(settings.letterboxdUsername);

  const year       = new Date().getFullYear();
  const yearStart  = `${year}-01-01`;
  const yearEnd    = `${year + 1}-01-01`;

  // Measure grid container width → derive cell size
  const gridRef = useRef<HTMLDivElement>(null);
  const [sq, setSq] = useState(11);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const cols = 53;
      const avail = el.offsetWidth - DOW_W - GAP - cols * GAP;
      setSq(Math.max(6, Math.min(14, Math.floor(avail / cols))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch gym workouts
  const [gymWorkouts, setGymWorkouts] = useState<HevyWorkoutFull[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchGym = useCallback(() => {
    setLoading(true);
    fetch(`/api/hevy/workouts?year=${year}`)
      .then(r => r.json())
      .then(d => setGymWorkouts(d.workouts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);
  useEffect(() => { fetchGym(); }, [fetchGym]);

  // Fetch obsidian notes
  const [obsidianFiles, setObsidianFiles] = useState<{ mtime: number }[]>([]);
  useEffect(() => {
    if (!settings.obsidianVaultPath) { setObsidianFiles([]); return; }
    fetch(`/api/obsidian/files?vault=${encodeURIComponent(settings.obsidianVaultPath)}`)
      .then(r => r.json())
      .then(d => setObsidianFiles(d.files ?? []))
      .catch(() => {});
  }, [settings.obsidianVaultPath]);

  // Goals
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);
  useEffect(() => {
    const all = loadGoals().filter(g => goalYear(g) === year);
    setGoalsTotal(all.length);
    setGoalsDone(all.filter(g => g.status === "done").length);
  }, [year]);

  // Build activity map
  const gymDates  = gymWorkouts.filter(w => w.date >= yearStart && w.date < yearEnd).map(w => w.date);
  const filmDates = films.filter(f => f.watchedDate >= yearStart && f.watchedDate < yearEnd).map(f => f.watchedDate);
  const noteDates = obsidianFiles.map(f => toDateKey(new Date(f.mtime))).filter(d => d >= yearStart && d < yearEnd);
  const activityMap = mergeActivities(gymDates, filmDates, noteDates);

  // Grid geometry
  const days      = buildYearDays(year);
  const jan1      = new Date(year, 0, 1);
  const jan1dow   = (jan1.getDay() + 6) % 7; // Mon=0
  const totalCols = Math.ceil((days.length + jan1dow) / 7);
  const monthCols = getMonthStartCols(year);
  const todayKey  = toDateKey(new Date());
  const step      = sq + GAP;
  const BR        = Math.max(1, Math.round(sq * 0.2));

  return (
    <Panel style={{ display: "flex", flexDirection: "column", padding: 16 }}>
      {/* Header row */}
      <div className="hayati-drag-handle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Tag color={C.textFaint}>Overview {year}</Tag>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* Stats */}
          {[
            { icon: <Dumbbell size={9} strokeWidth={2} color={CAT_COLORS.gym}  />, val: gymDates.length  },
            { icon: <Clapperboard size={9} strokeWidth={2} color={CAT_COLORS.film} />, val: filmDates.length },
            { icon: <FileText size={9} strokeWidth={2} color={CAT_COLORS.note} />, val: noteDates.length },
            { icon: <Target size={9} strokeWidth={2} color={C.textMuted} />, val: goalsTotal ? `${goalsDone}/${goalsTotal}` : "—" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted }}>
              {s.icon}{s.val}
            </div>
          ))}
          {loading && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>loading…</span>}
        </div>
      </div>

      {/* Grid */}
      <div ref={gridRef} style={{ width: "100%", overflow: "hidden" }}>
        {/* Month labels */}
        <div style={{ paddingLeft: DOW_W + GAP, position: "relative", height: 13, marginBottom: 4 }}>
          {monthCols.map(({ col, label }) => (
            <span key={label} style={{
              position: "absolute", left: col * step,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: C.textFaint, letterSpacing: "0.2px", userSelect: "none",
            }}>
              {label.toLowerCase()}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
          {/* Day-of-week labels */}
          <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${sq}px)`, gap: GAP, width: DOW_W, flexShrink: 0 }}>
            {DOW_LABELS.map((l, i) => (
              <div key={i} style={{
                height: sq, display: "flex", alignItems: "center", justifyContent: "flex-end",
                paddingRight: 4,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: Math.min(9, Math.max(7, Math.round(sq * 0.65))),
                color: i % 2 === 0 ? C.textFaint : "transparent",
                userSelect: "none",
              }}>
                {l}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div style={{
            display: "grid",
            gridTemplateRows: `repeat(7, ${sq}px)`,
            gridAutoColumns: `${sq}px`,
            gridAutoFlow: "column",
            gap: GAP,
          }}>
            {Array.from({ length: jan1dow }).map((_, i) => (
              <div key={`pad${i}`} style={{ width: sq, height: sq }} />
            ))}
            {days.map((date, i) => {
              const dateKey    = toDateKey(date);
              const cats       = activityMap.get(dateKey);
              const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
              const isToday    = dateKey === todayKey;
              return (
                <div key={i} title={dateKey} style={{
                  width: sq, height: sq, borderRadius: BR,
                  background: C.surface,
                  border: isToday ? `1px solid ${C.accentMid}` : `1px solid ${activeCats.length ? "transparent" : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                }}>
                  {activeCats.map(cat => {
                    const Icon = CAT_ICONS[cat];
                    const sz = activeCats.length === 1 ? Math.max(5, sq - 4) : activeCats.length === 2 ? Math.max(4, sq - 6) : Math.max(3, sq - 8);
                    return <Icon key={cat} size={sz} color={CAT_COLORS[cat]} strokeWidth={2} style={{ flexShrink: 0 }} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
