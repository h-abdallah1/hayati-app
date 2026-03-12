"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dumbbell, Clapperboard, FileText, GitMerge, BookOpen, Flame } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { useGithub } from "@/lib/hooks/useGithub";
import type { ObsidianFile } from "@/app/api/obsidian/files/route";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import type { Goal, ReadingEntry } from "@/lib/types";
import { load as loadGoals, persist as persistGoals, goalYear, STATUS_ICON, STATUS_CYCLE } from "@/lib/goals";
import { load as loadBooks } from "@/lib/books";
import { calcStreak } from "@/app/gym/helpers";
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

// ── Year stats helpers ─────────────────────────────────────────────────────

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

function StatBox({
  label, value, sub, hi, icon, C,
}: {
  label: string; value: string; sub?: string; hi?: boolean; icon?: React.ReactNode;
  C: ReturnType<typeof useTheme>;
}) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
        color: C.textFaint, letterSpacing: "0.6px",
        textTransform: "uppercase", marginBottom: 3,
      }}>
        {icon}{label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 20,
        color: hi ? C.accent : C.text, lineHeight: 1,
      }}>
        {value}
        {sub && (
          <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 4 }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

const CELL = 18;
const GAP = 5;
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_COLOR = "#ff6b00";

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

const CAT_COLORS: Record<ActivityCategory, string> = {
  gym:     "#4a9eff",
  film:    "#ff6b6b",
  note:    "#f5a623",
  commit:  "#22c55e",
  reading: "#a78bfa",
};

const CAT_LABELS: Record<ActivityCategory, string> = {
  gym:     "Gym",
  film:    "Film",
  note:    "Note",
  commit:  "Commit",
  reading: "Reading",
};

const ORDERED_CATS: ActivityCategory[] = ["gym", "film", "note", "commit", "reading"];

const CAT_ICONS = {
  gym:     Dumbbell,
  film:    Clapperboard,
  note:    FileText,
  commit:  GitMerge,
  reading: BookOpen,
} as const;

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
  const { films, loaded: filmsLoaded } = useLetterboxd(settings.letterboxdUsername);
  const { days: commitDays, loaded: githubLoaded } = useGithub(settings.githubUsername, settings.githubToken, year);

  // Goals
  const [goals, setGoals] = useState<Goal[]>([]);
  useEffect(() => { setGoals(loadGoals()); }, []);

  // Books (manual localStorage — read-only here, logging is on /reading)
  const [books, setBooks] = useState<ReadingEntry[]>([]);
  useEffect(() => { setBooks(loadBooks()); }, []);
  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; dateKey: string } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Month filter: null = All, 0–11 = month index
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Reset month filter when year changes
  useEffect(() => { setSelectedMonth(null); }, [year]);

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

  const filteredCommitDays = commitDays.filter(d => d.date >= yearStart && d.date < yearEnd);
  const commitDates = filteredCommitDays.map(d => d.date);
  const totalCommits = filteredCommitDays.reduce((sum, d) => sum + d.count, 0);

  const readingDates = books
    .filter(b => b.finishedDate >= yearStart && b.finishedDate < yearEnd)
    .map(b => b.finishedDate);

  const gymStreak = calcStreak(gymDates);

  const activityMap = mergeActivities(gymDates, filmDates, noteDates, commitDates, readingDates);

  const allDates = [...gymDates, ...filmDates, ...noteDates, ...commitDates, ...readingDates];
  const streakSet = buildStreakSet(allDates);
  const streakTipKey = (() => {
    const d = new Date();
    if (streakSet.has(toDateKey(d))) return toDateKey(d);
    d.setDate(d.getDate() - 1);
    return streakSet.has(toDateKey(d)) ? toDateKey(d) : null;
  })();

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

  // Commit details for activity feed: group by date → "N commits"
  const commitDetailMap = new Map<string, number>();
  for (const d of commitDays) {
    if (d.date >= yearStart && d.date < yearEnd) {
      commitDetailMap.set(d.date, (commitDetailMap.get(d.date) ?? 0) + d.count);
    }
  }
  const commitDetails = [...commitDetailMap.entries()].map(([date, count]) => ({
    date,
    label: `${count} commit${count !== 1 ? "s" : ""}`,
  }));

  const readingDetails = books
    .filter(b => b.finishedDate >= yearStart && b.finishedDate < yearEnd)
    .map(b => ({
      date: b.finishedDate,
      label: `${b.title}${b.author ? ` · ${b.author}` : ""}`,
    }));

  const feedEntries = buildActivityFeed(activityMap, gymDetails, filmDetails, noteDetails, commitDetails, readingDetails);

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

  const loading = gymLoading || obsidianLoading || !filmsLoaded || (!!settings.githubUsername && !githubLoaded);

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

      {/* Year stats bar */}
      {(() => {
        const now = new Date();
        const leap = isLeapYear(year);
        const total = leap ? 366 : 365;
        const today =
          year < currentYear ? total :
          year > currentYear ? 0 :
          dayOfYear(now);
        const displayDay = Math.min(today, total);
        const pct = ((displayDay / total) * 100).toFixed(1);
        const jan1DOW = new Date(year, 0, 1).getDay();
        const refDate = year < currentYear ? new Date(year, 11, 31)
                      : year > currentYear ? new Date(year, 0, 1)
                      : now;
        const weekNum = year < currentYear ? 52
                      : year > currentYear ? 1
                      : Math.ceil((today + jan1DOW) / 7);
        const quarter = Math.ceil((refDate.getMonth() + 1) / 3);
        return (
          <div style={{ display: "flex", gap: 28, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
            <StatBox label="day of year" value={String(displayDay)} sub={`/ ${total}`} C={C} />
            <StatBox label="remaining"   value={String(total - displayDay)} sub="days" C={C} />
            <StatBox label="complete"    value={`${pct}%`} hi C={C} />
            <StatBox label="week"        value={String(weekNum)} sub="/ 52" C={C} />
            <StatBox label="quarter"     value={`Q${quarter}`} C={C} />
            <div style={{ width: 1, height: 32, background: C.border, alignSelf: "flex-end", marginBottom: 2 }} />
            <StatBox label="gym"     value={loading ? "—" : String(gymDates.length)}    sub={!loading && gymStreak > 0 ? `${gymStreak}d streak` : undefined} icon={<Dumbbell      size={11} color={CAT_COLORS.gym}    strokeWidth={2} />} C={C} />
            <StatBox label="films"   value={loading ? "—" : String(filmDates.length)}   icon={<Clapperboard  size={11} color={CAT_COLORS.film}   strokeWidth={2} />} C={C} />
            <StatBox label="notes"   value={loading ? "—" : String(noteDates.length)}   icon={<FileText      size={11} color={CAT_COLORS.note}   strokeWidth={2} />} C={C} />
            {settings.githubUsername && (
              <StatBox label="commits" value={loading ? "—" : String(totalCommits)} icon={<GitMerge    size={11} color={CAT_COLORS.commit} strokeWidth={2} />} C={C} />
            )}
            {readingDates.length > 0 && (
              <StatBox label="books" value={String(readingDates.length)} icon={<BookOpen size={11} color={CAT_COLORS.reading} strokeWidth={2} />} C={C} />
            )}
          </div>
        );
      })()}

      {/* Year Grid */}
      <div style={{ overflowX: "auto", marginBottom: 40 }}>
        <div style={{ position: "relative", display: "inline-block", minWidth: "100%" }}>
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
              marginBottom: rowIdx === 6 ? 0 : GAP,
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
                const isStreak = streakSet.has(dateKey);
                const isStreakTip = dateKey === streakTipKey;
                const borderPaint = (() => {
                  if (isStreak) return STREAK_COLOR;
                  if (isToday)  return C.accentMid;
                  const cs = activeCats.map(c => CAT_COLORS[c]);
                  if (cs.length === 0) return C.border;
                  if (cs.length === 1) return cs[0];
                  if (cs.length === 2) return `linear-gradient(to right, ${cs[0]} 50%, ${cs[1]} 50%)`;
                  if (cs.length === 3) return `linear-gradient(to right, ${cs[0]} 33.3%, ${cs[1]} 33.3% 66.6%, ${cs[2]} 66.6%)`;
                  if (cs.length === 4) return `conic-gradient(from -45deg, ${cs[0]} 90deg, ${cs[1]} 180deg, ${cs[2]} 270deg, ${cs[3]} 360deg)`;
                  return `linear-gradient(to right, ${cs.join(", ")})`;
                })();

                return (
                  <div
                    key={colIdx}
                    title={dateKey}
                    onClick={() => hasActivity && scrollToDate(dateKey)}
                    onMouseEnter={e => {
                      if (hasActivity) {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltip({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 4, dateKey });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: borderPaint,
                      padding: 1,
                      cursor: hasActivity ? "pointer" : "default",
                      position: "relative",
                      overflow: "visible",
                    }}
                  >
                    <div style={{
                      width: "100%", height: "100%",
                      borderRadius: 1,
                      background: C.surface,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                      {activeCats.length === 1 ? (() => {
                        const Icon = CAT_ICONS[activeCats[0]];
                        return <Icon size={11} color={CAT_COLORS[activeCats[0]]} strokeWidth={2} />;
                      })() : activeCats.length <= 4 ? (
                        <div style={{
                          display: "flex", flexWrap: "wrap",
                          width: "100%", height: "100%",
                          alignContent: "center", justifyContent: "center",
                          gap: 1, padding: 1,
                        }}>
                          {activeCats.map(cat => {
                            const Icon = CAT_ICONS[cat];
                            return <Icon key={cat} size={6} color={CAT_COLORS[cat]} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
                          })}
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                          {activeCats.map(cat => (
                            <div key={cat} style={{ width: 3, height: 3, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                          ))}
                        </div>
                      )}
                    </div>
                    {isStreakTip && (
                      <Flame
                        size={13}
                        color={STREAK_COLOR}
                        strokeWidth={2}
                        style={{ position: "absolute", top: -5, right: -5, flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {loading && (
          <>
            <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
            <div style={{ textAlign: "center", marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
              <span style={{ animation: "pulse 1.2s ease-in-out infinite" }}>loading</span>
            </div>
          </>
        )}
      </div>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />

      {/* Goals + Activity Feed side by side */}
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>

        {/* Goals column */}
        {(() => {
          const yearGoals = goals.filter(g => goalYear(g) === year);
          const doneCount = yearGoals.filter(g => g.status === "done").length;
          const pct = yearGoals.length ? Math.round(doneCount / yearGoals.length * 100) : 0;
          const cycleGoalStatus = (id: number) => {
            const next = goals.map(g => {
              if (g.id !== id) return g;
              const ns = STATUS_CYCLE[g.status];
              return { ...g, status: ns, completedAt: ns === "done" ? new Date().toISOString() : undefined };
            });
            setGoals(next);
            persistGoals(next);
          };
          return (
            <div style={{ flex: "0 0 300px", minWidth: 0, paddingRight: 32, marginRight: 32, borderRight: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: C.textFaint, letterSpacing: "0.06em" }}>GOALS {year}</span>
                {yearGoals.length > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
                    {doneCount}/{yearGoals.length} done
                    {" "}<span style={{ color: pct >= 80 ? C.teal : pct >= 40 ? C.accent : C.textFaint }}>({pct}%)</span>
                  </span>
                )}
                <button
                  onClick={() => setAddingGoal(true)}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: 0 }}
                >
                  + add
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {yearGoals.map((g, i) => (
                  <div key={g.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 0",
                    borderBottom: i < yearGoals.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <button
                      onClick={() => cycleGoalStatus(g.id)}
                      title="click to cycle status"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                        color: g.status === "done" ? C.textFaint : g.status === "active" ? C.accent : C.textMuted,
                        padding: 0, marginTop: 1, flexShrink: 0, lineHeight: 1,
                      }}
                    >
                      {STATUS_ICON[g.status]}
                    </button>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                      color: g.status === "done" ? C.textFaint : C.text,
                      textDecoration: g.status === "done" ? "line-through" : "none",
                      textDecorationColor: C.textFaint,
                      flex: 1,
                    }}>
                      {g.title}
                    </span>
                    {g.optional && (
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                        color: C.textFaint, background: C.textFaint + "14",
                        border: `1px solid ${C.textFaint}33`,
                        borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                      }}>
                        optional
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {addingGoal ? (
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <input
                    autoFocus
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                    placeholder="new goal..."
                    onKeyDown={e => {
                      if (e.key === "Enter" && newGoalTitle.trim()) {
                        const next = [...goals, { id: Date.now(), title: newGoalTitle.trim(), status: "todo" as const, year, created: new Date().toISOString() }];
                        setGoals(next); persistGoals(next);
                        setNewGoalTitle(""); setAddingGoal(false);
                      }
                      if (e.key === "Escape") { setNewGoalTitle(""); setAddingGoal(false); }
                    }}
                    style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, outline: "none" }}
                  />
                  <button onClick={() => { setNewGoalTitle(""); setAddingGoal(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, padding: "0 4px" }}>✕</button>
                </div>
              ) : null}

            </div>
          );
        })()}

        {/* Activity Feed column */}
        <div ref={feedRef} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.textFaint, letterSpacing: "0.06em", marginBottom: 16 }}>ACTIVITY FEED</div>

          {/* Month filter segments */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 20 }}>
            {[null, 0,1,2,3,4,5,6,7,8,9,10,11].map(m => {
              const active = selectedMonth === m;
              const label = m === null ? "All" : new Date(year, m, 1).toLocaleDateString("en-US", { month: "short" });
              return (
                <button
                  key={m ?? "all"}
                  onClick={() => setSelectedMonth(m)}
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    borderRadius: 4,
                    border: `1px solid ${active ? C.accentMid : C.border}`,
                    background: active ? C.accentDim : "transparent",
                    color: active ? C.accent : C.textMuted,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 36, height: 10, borderRadius: 3, background: C.border, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <div style={{ width: "40%", height: 10, borderRadius: 3, background: C.border }} />
                  <div style={{ width: "65%", height: 10, borderRadius: 3, background: C.border }} />
                </div>
              </div>
            ))
          ) : (() => {
            const visible = selectedMonth === null
              ? feedEntries
              : feedEntries.filter(e => new Date(e.date).getMonth() === selectedMonth);
            if (visible.length === 0)
              return <div style={{ fontSize: 12, color: C.textFaint }}>No activity recorded for {year}.</div>;
            return (
              <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 24 }}>
                {visible.map(entry => (
                  <div key={entry.date} data-date={entry.date} style={{ position: "relative", paddingBottom: 24 }}>
                    <div style={{
                      position: "absolute", left: -29,
                      width: 8, height: 8,
                      borderRadius: 2,
                      background: C.border,
                      transform: "rotate(45deg)",
                      top: 3,
                    }} />
                    <div style={{
                      fontSize: 11, fontWeight: 600,
                      color: C.textMuted,
                      marginBottom: 8,
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      {formatDateFull(entry.date)}
                    </div>
                    {entry.items.map((item, i) => (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        marginBottom: 6,
                      }}>
                        {(() => { const Icon = CAT_ICONS[item.category]; return <Icon size={13} color={CAT_COLORS[item.category]} strokeWidth={1.8} style={{ flexShrink: 0 }} />; })()}
                        <span style={{ color: C.textMuted }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

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
            minWidth: 140,
            maxWidth: 260,
          }}>
            <div style={{ color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>
              {formatDateShort(tooltip.dateKey)}
            </div>
            {activeCats.flatMap(cat => {
              let entries: string[] = [];
              if (cat === "gym") {
                const v = gymDetailMap.get(tooltip.dateKey);
                if (v) entries = [v];
              } else if (cat === "film") {
                entries = filmDetailMap.get(tooltip.dateKey) ?? [];
              } else if (cat === "note") {
                entries = noteDetailMap.get(tooltip.dateKey) ?? [];
              } else if (cat === "commit") {
                const n = commitDetailMap.get(tooltip.dateKey);
                if (n != null) entries = [`${n} commit${n !== 1 ? "s" : ""}`];
              } else if (cat === "reading") {
                entries = readingDetails.filter(r => r.date === tooltip.dateKey).map(r => r.label);
              }
              const MAX = 4;
              const overflow = entries.length > MAX ? entries.length - MAX : 0;
              const shown = overflow ? entries.slice(0, MAX) : entries;
              if (shown.length === 0) {
                return [(
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                    <span style={{ color: CAT_COLORS[cat] }}>{CAT_LABELS[cat]}</span>
                  </div>
                )];
              }
              return [
                ...shown.map((entry, i) => (
                  <div key={`${cat}-${i}`} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat], flexShrink: 0 }} />
                    <span style={{ color: C.text }}>{entry}</span>
                  </div>
                )),
                ...(overflow > 0 ? [(
                  <div key={`${cat}-more`} style={{ paddingLeft: 11, marginBottom: 2, color: C.textFaint }}>
                    +{overflow} more
                  </div>
                )] : []),
              ];
            })}
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
