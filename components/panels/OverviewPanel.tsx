"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Dumbbell, Clapperboard, FileText, Target, GitMerge, BookOpen, Flame } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { useGithub } from "@/lib/hooks/useGithub";
import { load as loadBooks } from "@/lib/books";
import type { ReadingEntry } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";
import { load as loadGoals, goalYear } from "@/lib/goals";
import {
  buildYearDays, mergeActivities, toDateKey, getMonthStartCols,
  type ActivityCategory,
} from "@/app/overview/helpers";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";

const CAT_COLORS: Record<ActivityCategory, string> = {
  gym:     "#4a9eff",
  film:    "#ff6b6b",
  note:    "#f5a623",
  commit:  "#22c55e",
  reading: "#a78bfa",
};

const CAT_ICONS = {
  gym:     Dumbbell,
  film:    Clapperboard,
  note:    FileText,
  commit:  GitMerge,
  reading: BookOpen,
} as const;

const ORDERED_CATS: ActivityCategory[] = ["gym", "film", "note", "commit", "reading"];
const STREAK_COLOR = "#ff6b00";
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function buildStreakSet(dates: string[]): Set<string> {
  const dateSet = new Set(dates);
  const set = new Set<string>();
  const d = new Date();
  if (!dateSet.has(toDateKey(d))) d.setDate(d.getDate() - 1);
  while (dateSet.has(toDateKey(d))) {
    set.add(toDateKey(d));
    d.setDate(d.getDate() - 1);
  }
  return set;
}
const DOW_W = 20; // px for day-label column
const GAP   = 3;

export function OverviewPanel() {
  const C = useTheme();
  const { global: settings } = useGlobalSettings();
  const year       = new Date().getFullYear();
  const { films } = useLetterboxd(settings.letterboxdUsername);
  const { days: commitDays } = useGithub(settings.githubUsername, settings.githubToken, year);
  const [books, setBooks] = useState<ReadingEntry[]>([]);
  useEffect(() => { setBooks(loadBooks()); }, []);
  const yearStart  = `${year}-01-01`;
  const yearEnd    = `${year + 1}-01-01`;

  // Measure grid container width → derive cell size
  const gridRef = useRef<HTMLDivElement>(null);
  const [sq, setSq] = useState(11);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      // sq drives row height only; clamp so rows look proportional to panel width
      const colW = (el.offsetWidth - DOW_W - GAP) / 53;
      setSq(Math.max(6, Math.min(14, Math.floor(colW))));
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
  const gymDates     = gymWorkouts.filter(w => w.date >= yearStart && w.date < yearEnd).map(w => w.date);
  const filmDates    = films.filter(f => f.watchedDate >= yearStart && f.watchedDate < yearEnd).map(f => f.watchedDate);
  const noteDates    = obsidianFiles.map(f => toDateKey(new Date(f.mtime))).filter(d => d >= yearStart && d < yearEnd);
  const commitDates  = commitDays.filter(d => d.date >= yearStart && d.date < yearEnd).map(d => d.date);
  const readingDates = books.filter(b => b.finishedDate >= yearStart && b.finishedDate < yearEnd).map(b => b.finishedDate);
  const activityMap  = mergeActivities(gymDates, filmDates, noteDates, commitDates, readingDates);

  const { streakSet, streakTipKey } = useMemo(() => {
    const allDates = [...gymDates, ...filmDates, ...noteDates, ...commitDates, ...readingDates];
    const set = buildStreakSet(allDates);
    const d = new Date();
    const tip = set.has(toDateKey(d)) ? toDateKey(d) : (() => {
      d.setDate(d.getDate() - 1);
      return set.has(toDateKey(d)) ? toDateKey(d) : null;
    })();
    return { streakSet: set, streakTipKey: tip };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymWorkouts, films, obsidianFiles, commitDays, books]);

  // Grid geometry
  const days      = buildYearDays(year);
  const jan1      = new Date(year, 0, 1);
  const jan1dow   = (jan1.getDay() + 6) % 7; // Mon=0
  const totalCols = Math.ceil((days.length + jan1dow) / 7);
  const monthCols = getMonthStartCols(year);
  const todayKey  = toDateKey(new Date());
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
            ...(settings.githubUsername ? [{ icon: <GitMerge size={9} strokeWidth={2} color={CAT_COLORS.commit} />, val: commitDates.length }] : []),
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
        {/* Month labels — same column template as cell grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `${DOW_W}px repeat(${totalCols}, 1fr)`,
          gap: `0 ${GAP}px`,
          marginBottom: 4,
        }}>
          <div />
          {Array.from({ length: totalCols }, (_, col) => {
            const mc = monthCols.find(m => m.col === col);
            return (
              <div key={col} style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: mc ? C.textFaint : "transparent",
                whiteSpace: "nowrap", overflow: "visible", userSelect: "none",
              }}>
                {mc?.label.toLowerCase() ?? ""}
              </div>
            );
          })}
        </div>

        {/* Rows — DOW labels + cell grid share the same column template */}
        {DOW_LABELS.map((dow, rowIdx) => (
          <div key={rowIdx} style={{
            display: "grid",
            gridTemplateColumns: `${DOW_W}px repeat(${totalCols}, 1fr)`,
            gap: `${GAP}px`,
            marginBottom: rowIdx === 6 ? 0 : GAP,
          }}>
            {/* Day-of-week label */}
            <div style={{
              fontSize: 9, color: C.textFaint,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              paddingRight: 4, userSelect: "none", aspectRatio: "1",
              visibility: rowIdx % 2 === 0 ? "visible" : "hidden",
            }}>
              {dow}
            </div>

            {/* Cells for this row */}
            {Array.from({ length: totalCols }, (_, colIdx) => {
              const dayIndex = colIdx * 7 + rowIdx - jan1dow;
              if (dayIndex < 0 || dayIndex >= days.length) {
                return <div key={colIdx} style={{ aspectRatio: "1" }} />;
              }
              const dateKey    = toDateKey(days[dayIndex]);
              const cats       = activityMap.get(dateKey);
              const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
              const isToday     = dateKey === todayKey;
              const isStreak    = streakSet.has(dateKey);
              const isStreakTip = dateKey === streakTipKey;
              const catColor    = activeCats.length ? CAT_COLORS[activeCats[0]] : null;
              return (
                <div key={colIdx} title={dateKey} style={{
                  aspectRatio: "1", borderRadius: BR,
                  background: C.surface,
                  border: isStreak
                    ? `1px solid ${STREAK_COLOR}`
                    : isToday
                      ? `1px solid ${C.accentMid}`
                      : catColor
                        ? `1px solid ${catColor}`
                        : `1px solid ${C.border}`,
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                  overflow: "visible",
                }}>
                  {activeCats.length === 1 ? (() => {
                    const Icon = CAT_ICONS[activeCats[0]];
                    const sz = Math.max(5, sq - 4);
                    return <Icon size={sz} color={CAT_COLORS[activeCats[0]]} strokeWidth={2} style={{ flexShrink: 0 }} />;
                  })() : activeCats.length <= 4 ? (
                    <div style={{
                      display: "flex", flexWrap: "wrap",
                      width: "100%", height: "100%",
                      alignContent: "center", justifyContent: "center",
                      gap: 1, padding: 1,
                    }}>
                      {activeCats.map(cat => {
                        const Icon = CAT_ICONS[cat];
                        const sz = Math.max(4, Math.floor(sq / 2) - 1);
                        return <Icon key={cat} size={sz} color={CAT_COLORS[cat]} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                      {activeCats.map(cat => (
                        <div key={cat} style={{ width: 3, height: 3, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                  {isStreakTip && (
                    <Flame
                      size={Math.max(5, sq - 5)}
                      color={STREAK_COLOR}
                      strokeWidth={2}
                      style={{ position: "absolute", top: -4, right: -4, flexShrink: 0 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Panel>
  );
}
