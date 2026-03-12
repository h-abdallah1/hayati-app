"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Dumbbell, Clapperboard, FileText, Target, GitMerge } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { useGithub } from "@/lib/hooks/useGithub";
import { load as loadBooks } from "@/lib/books";
import type { ReadingEntry } from "@/lib/types";
import { Panel, Tag, YearGrid, CAT_COLORS, ORDERED_CATS, buildStreakSet } from "@/components/ui";
import { load as loadGoals, goalYear } from "@/lib/goals";
import { mergeActivities, toDateKey, formatDateShort, type ActivityCategory } from "@/app/overview/helpers";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";

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
  const [obsidianFiles, setObsidianFiles] = useState<{ mtime: number; name: string }[]>([]);
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

  // Detail maps for tooltip
  const gymDetailMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of gymWorkouts) {
      if (w.date >= yearStart && w.date < yearEnd) {
        const prev = m.get(w.date);
        m.set(w.date, prev ? `${prev}, ${w.title}` : `${w.title} · ${w.duration}m`);
      }
    }
    return m;
  }, [gymWorkouts, yearStart, yearEnd]);

  const filmDetailMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const f of films) {
      if (f.watchedDate >= yearStart && f.watchedDate < yearEnd) {
        if (!m.has(f.watchedDate)) m.set(f.watchedDate, []);
        const stars = f.rating ? "★".repeat(Math.floor(f.rating)) + (f.rating % 1 >= 0.5 ? "½" : "") : "";
        m.get(f.watchedDate)!.push(`${f.title}${stars ? ` ${stars}` : ""}`);
      }
    }
    return m;
  }, [films, yearStart, yearEnd]);

  const noteDetailMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const f of obsidianFiles) {
      const d = toDateKey(new Date(f.mtime));
      if (d >= yearStart && d < yearEnd) {
        if (!m.has(d)) m.set(d, []);
        m.get(d)!.push(f.name);
      }
    }
    return m;
  }, [obsidianFiles, yearStart, yearEnd]);

  const commitDetailMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of commitDays) {
      if (d.date >= yearStart && d.date < yearEnd) m.set(d.date, (m.get(d.date) ?? 0) + d.count);
    }
    return m;
  }, [commitDays, yearStart, yearEnd]);

  const readingDetailMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const b of books) {
      if (b.finishedDate >= yearStart && b.finishedDate < yearEnd) {
        if (!m.has(b.finishedDate)) m.set(b.finishedDate, []);
        m.get(b.finishedDate)!.push(`${b.title}${b.author ? ` · ${b.author}` : ""}`);
      }
    }
    return m;
  }, [books, yearStart, yearEnd]);

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
      <YearGrid
        year={year}
        activityMap={activityMap}
        streakSet={streakSet}
        streakTipKey={streakTipKey}
        fluid
        gap={3}
        dowWidth={20}
        monthLabelLower
        streakBorderWidth={1}
        tooltipContent={(dateKey) => {
          const cats = activityMap.get(dateKey);
          const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
          const CAT_LABELS: Record<ActivityCategory, string> = {
            gym: "Gym", film: "Film", note: "Note", commit: "Commit", reading: "Reading",
          };
          return (
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              padding: "6px 10px",
              fontSize: 11,
              color: C.text,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              minWidth: 140,
              maxWidth: 260,
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              <div style={{ color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>
                {formatDateShort(dateKey)}
              </div>
              {activeCats.flatMap(cat => {
                let entries: string[] = [];
                if (cat === "gym") { const v = gymDetailMap.get(dateKey); if (v) entries = [v]; }
                else if (cat === "film") { entries = filmDetailMap.get(dateKey) ?? []; }
                else if (cat === "note") { entries = noteDetailMap.get(dateKey) ?? []; }
                else if (cat === "commit") { const n = commitDetailMap.get(dateKey); if (n != null) entries = [`${n} commit${n !== 1 ? "s" : ""}`]; }
                else if (cat === "reading") { entries = readingDetailMap.get(dateKey) ?? []; }
                const MAX = 4;
                const overflow = entries.length > MAX ? entries.length - MAX : 0;
                const shown = overflow ? entries.slice(0, MAX) : entries;
                if (shown.length === 0) return [(
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                    <span style={{ color: CAT_COLORS[cat] }}>{CAT_LABELS[cat]}</span>
                  </div>
                )];
                return [
                  ...shown.map((entry, i) => (
                    <div key={`${cat}-${i}`} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                      <span style={{ color: C.text }}>{entry}</span>
                    </div>
                  )),
                  ...(overflow > 0 ? [(
                    <div key={`${cat}-more`} style={{ paddingLeft: 11, marginBottom: 2, color: C.textFaint }}>+{overflow} more</div>
                  )] : []),
                ];
              })}
            </div>
          );
        }}
      />
    </Panel>
  );
}
