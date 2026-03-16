"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Clapperboard, FileText, GitMerge, BookOpen,
  Flame, Gamepad2, ChevronDown, ChevronUp, Plus, X,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { useGithub } from "@/lib/hooks/useGithub";
import { useClock } from "@/lib/hooks";
import type { ObsidianFile } from "@/app/api/obsidian/files/route";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import type { Goal, ReadingEntry, GameEntry } from "@/lib/types";
import { load as loadGoals, persist as persistGoals, goalYear, STATUS_ICON, STATUS_CYCLE } from "@/lib/goals";
import { load as loadBooks } from "@/lib/books";
import { loadGames } from "@/lib/gameList";
import { calcWeekStreak } from "@/app/gym/helpers";
import {
  mergeActivities, buildActivityFeed, toDateKey,
  formatDateShort, formatDateFull,
  type ActivityCategory,
} from "@/app/overview/helpers";
import { YearGrid, CAT_COLORS, CAT_ICONS, ORDERED_CATS, buildStreakSet } from "@/components/ui";
import { FONT_MONO, FONT_HEADING, FONT_ARABIC, getGreeting } from "@/lib/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

const CAT_LABELS: Record<ActivityCategory, string> = {
  gym: "Gym", film: "Film", note: "Note",
  commit: "Commit", reading: "Reading", gaming: "Gaming",
};

// ── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  label, value, sub, hi, icon, C,
}: {
  label: string; value: string; sub?: string; hi?: boolean;
  icon?: React.ReactNode;
  C: ReturnType<typeof useTheme>;
}) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      minWidth: 80,
      flexShrink: 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontFamily: FONT_MONO, fontSize: 9,
        color: C.textFaint, letterSpacing: "0.5px",
        textTransform: "uppercase", marginBottom: 4,
      }}>
        {icon}{label}
      </div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 18,
        color: hi ? C.accent : C.text, lineHeight: 1,
      }}>
        {value}
        {sub && <span style={{ fontSize: 10, color: C.textFaint, marginLeft: 3 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MobileOverviewPage() {
  const C = useTheme();
  const time = useClock();
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
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  useEffect(() => { setGoals(loadGoals()); }, []);

  // Books & Games
  const [books, setBooks] = useState<ReadingEntry[]>([]);
  const [games, setGames] = useState<GameEntry[]>([]);
  useEffect(() => { setBooks(loadBooks()); }, []);
  useEffect(() => { setGames(loadGames()); }, []);

  const [addingGoal, setAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");

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

  // Derive date keys
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const gymDates = gymWorkouts.filter(w => w.date >= yearStart && w.date < yearEnd).map(w => w.date);
  const filmDates = films.filter(f => f.watchedDate >= yearStart && f.watchedDate < yearEnd).map(f => f.watchedDate);
  const noteDates = obsidianFiles.map(f => toDateKey(new Date(f.mtime))).filter(d => d >= yearStart && d < yearEnd);
  const filteredCommitDays = commitDays.filter(d => d.date >= yearStart && d.date < yearEnd);
  const commitDates = filteredCommitDays.map(d => d.date);
  const totalCommits = filteredCommitDays.reduce((sum, d) => sum + d.count, 0);
  const readingDates = books.filter(b => b.finishedDate >= yearStart && b.finishedDate < yearEnd).map(b => b.finishedDate);
  const gamingDates = games.filter(g => g.finishedDate && g.finishedDate >= yearStart && g.finishedDate < yearEnd).map(g => g.finishedDate!);

  const gymWeekStreak = calcWeekStreak(gymDates);
  const activityMap = mergeActivities(gymDates, filmDates, noteDates, commitDates, readingDates, gamingDates);
  const allDates = [...gymDates, ...filmDates, ...noteDates, ...commitDates, ...readingDates, ...gamingDates];
  const streakSet = buildStreakSet(allDates);
  const streakTipKey = streakSet.size > 0 ? [...streakSet].sort().at(-1)! : null;

  // Feed details
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
  const commitDetailMap = new Map<string, number>();
  for (const d of commitDays) {
    if (d.date >= yearStart && d.date < yearEnd) {
      commitDetailMap.set(d.date, (commitDetailMap.get(d.date) ?? 0) + d.count);
    }
  }

  const gymDetails = [...gymDetailMap.entries()].map(([date, label]) => ({ date, label }));
  const filmDetails = [...filmDetailMap.entries()].flatMap(([date, titles]) => titles.map(label => ({ date, label })));
  const noteDetails = [...noteDetailMap.entries()].flatMap(([date, names]) => names.map(label => ({ date, label })));
  const commitDetails = [...commitDetailMap.entries()].map(([date, count]) => ({ date, label: `${count} commit${count !== 1 ? "s" : ""}` }));
  const readingDetails = books.filter(b => b.finishedDate >= yearStart && b.finishedDate < yearEnd).map(b => ({ date: b.finishedDate, label: `${b.title}${b.author ? ` · ${b.author}` : ""}` }));
  const gamingDetails = games.filter(g => g.finishedDate && g.finishedDate >= yearStart && g.finishedDate < yearEnd).map(g => ({ date: g.finishedDate!, label: `${g.title} · ${g.platform}` }));

  const feedEntries = buildActivityFeed(activityMap, gymDetails, filmDetails, noteDetails, commitDetails, readingDetails, gamingDetails);

  const loading = gymLoading || obsidianLoading || !filmsLoaded || (!!settings.githubUsername && !githubLoaded);

  // Year stats
  const now = new Date();
  const leap = isLeapYear(year);
  const total = leap ? 366 : 365;
  const today = year < currentYear ? total : year > currentYear ? 0 : dayOfYear(now);
  const displayDay = Math.min(today, total);
  const pct = ((displayDay / total) * 100).toFixed(1);

  // Goals
  const yearGoals = goals.filter(g => goalYear(g) === year);
  const doneCount = yearGoals.filter(g => g.status === "done").length;
  const goalPct = yearGoals.length ? Math.round(doneCount / yearGoals.length * 100) : 0;

  const cycleGoalStatus = (id: number) => {
    const next = goals.map(g => {
      if (g.id !== id) return g;
      const ns = STATUS_CYCLE[g.status];
      return { ...g, status: ns, completedAt: ns === "done" ? new Date().toISOString() : undefined };
    });
    setGoals(next);
    persistGoals(next);
  };

  const scrollToDate = useCallback((dateKey: string) => {
    if (!feedRef.current) return;
    const el = feedRef.current.querySelector(`[data-date="${dateKey}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: FONT_MONO,
      padding: "0 16px",
      paddingBottom: 80,
      maxWidth: 480,
      margin: "0 auto",
      WebkitFontSmoothing: "antialiased",
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: 48, paddingBottom: 20, textAlign: "center" }}>
        <div style={{ fontFamily: FONT_ARABIC, fontSize: 36, color: C.accent, lineHeight: 1 }}>ح</div>
        <div style={{ fontFamily: FONT_HEADING, fontSize: 11, fontWeight: 700, color: C.textFaint, letterSpacing: "0.12em", marginTop: 6 }}>
          {getGreeting(time)}, {settings.name}
        </div>
      </div>

      {/* ── Year Selector ──────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <span style={{ fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 700, color: C.text }}>
          OVERVIEW
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setYear(y => y - 1)} style={navBtn(C)}>←</button>
          <span style={{ fontSize: 13, color: C.textMuted, minWidth: 36, textAlign: "center" }}>{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            style={{ ...navBtn(C), opacity: year >= currentYear ? 0.3 : 1 }}
          >→</button>
        </div>
      </div>

      {/* ── Year Progress Bar ──────────────────────────────────── */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Day {displayDay} of {total}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{pct}%</span>
        </div>
        <div style={{
          height: 6, borderRadius: 3,
          background: C.border,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: C.accent,
            width: `${pct}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* ── Stats Row (horizontal scroll) ──────────────────────── */}
      <div style={{
        display: "flex", gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        marginBottom: 20,
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}>
        <StatPill label="streak" value={`${streakSet.size}d`} icon={<Flame size={10} color="#ff6b00" />} C={C} />
        <StatPill label="gym" value={loading ? "—" : String(gymDates.length)} sub={!loading && gymWeekStreak >= 3 ? `${gymWeekStreak}w` : undefined} icon={<Dumbbell size={10} color={CAT_COLORS.gym} />} C={C} />
        <StatPill label="films" value={loading ? "—" : String(filmDates.length)} icon={<Clapperboard size={10} color={CAT_COLORS.film} />} C={C} />
        <StatPill label="notes" value={loading ? "—" : String(noteDates.length)} icon={<FileText size={10} color={CAT_COLORS.note} />} C={C} />
        {settings.githubUsername && (
          <StatPill label="commits" value={loading ? "—" : String(totalCommits)} icon={<GitMerge size={10} color={CAT_COLORS.commit} />} C={C} />
        )}
        {readingDates.length > 0 && (
          <StatPill label="books" value={String(readingDates.length)} icon={<BookOpen size={10} color={CAT_COLORS.reading} />} C={C} />
        )}
        <StatPill label="games" value={String(gamingDates.length)} icon={<Gamepad2 size={10} color={CAT_COLORS.gaming} />} C={C} />
      </div>

      {/* ── Year Grid ──────────────────────────────────────────── */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "12px 10px",
        marginBottom: 20,
        overflowX: "auto",
      }}>
        <YearGrid
          year={year}
          activityMap={activityMap}
          streakSet={streakSet}
          streakTipKey={streakTipKey}
          fluid
          monthLabelLower
          streakBorderWidth={1}
          loading={loading}
          onCellClick={(dateKey, hasActivity) => { if (hasActivity) scrollToDate(dateKey); }}
        />
        {loading && (
          <>
            <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
            <div style={{ textAlign: "center", marginTop: 6, fontSize: 9, color: C.textFaint }}>
              <span style={{ animation: "pulse 1.2s ease-in-out infinite" }}>loading</span>
            </div>
          </>
        )}
      </div>

      {/* ── Goals Section ──────────────────────────────────────── */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        marginBottom: 20,
        overflow: "hidden",
      }}>
        {/* Header */}
        <button
          onClick={() => setGoalsExpanded(e => !e)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "12px 16px",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: C.textFaint, letterSpacing: "0.06em", fontFamily: FONT_MONO }}>
              GOALS {year}
            </span>
            {yearGoals.length > 0 && (
              <span style={{ fontSize: 10, color: C.textFaint, fontFamily: FONT_MONO }}>
                {doneCount}/{yearGoals.length}
                {" "}<span style={{ color: goalPct >= 80 ? C.teal : goalPct >= 40 ? C.accent : C.textFaint }}>({goalPct}%)</span>
              </span>
            )}
          </div>
          {goalsExpanded
            ? <ChevronUp size={14} color={C.textFaint} />
            : <ChevronDown size={14} color={C.textFaint} />
          }
        </button>

        {goalsExpanded && (
          <div style={{ padding: "0 16px 12px" }}>
            {yearGoals.map((g, i) => (
              <div key={g.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0",
                borderTop: i > 0 ? `1px solid ${C.border}` : "none",
              }}>
                <button
                  onClick={() => cycleGoalStatus(g.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: FONT_MONO, fontSize: 16,
                    color: g.status === "done" ? C.textFaint : g.status === "active" ? C.accent : C.textMuted,
                    padding: 0, flexShrink: 0, lineHeight: 1,
                    minWidth: 24, minHeight: 24,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {STATUS_ICON[g.status]}
                </button>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 12,
                  color: g.status === "done" ? C.textFaint : C.text,
                  textDecoration: g.status === "done" ? "line-through" : "none",
                  flex: 1,
                }}>
                  {g.title}
                </span>
                {g.optional && (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 8,
                    color: C.textFaint, background: C.textFaint + "14",
                    border: `1px solid ${C.textFaint}33`,
                    borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                  }}>
                    optional
                  </span>
                )}
              </div>
            ))}

            {addingGoal ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
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
                  }}
                  style={{
                    flex: 1, background: C.bg,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 12,
                    color: C.text, outline: "none",
                  }}
                />
                <button
                  onClick={() => { setNewGoalTitle(""); setAddingGoal(false); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={16} color={C.textFaint} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingGoal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginTop: 8, background: "none", border: "none",
                  cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11,
                  color: C.textFaint, padding: 0,
                }}
              >
                <Plus size={12} color={C.textFaint} /> add goal
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Activity Feed ──────────────────────────────────────── */}
      <div ref={feedRef}>
        <div style={{
          fontSize: 11, color: C.textFaint,
          letterSpacing: "0.06em", marginBottom: 14,
          fontFamily: FONT_MONO,
        }}>
          ACTIVITY FEED
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ width: "30%", height: 8, borderRadius: 4, background: C.border, marginBottom: 10 }} />
                <div style={{ width: "70%", height: 8, borderRadius: 4, background: C.border, marginBottom: 6 }} />
                <div style={{ width: "50%", height: 8, borderRadius: 4, background: C.border }} />
              </div>
            ))}
          </div>
        ) : feedEntries.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "32px 16px",
            fontSize: 12, color: C.textFaint,
          }}>
            No activity recorded for {year}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feedEntries.map(entry => (
              <div
                key={entry.date}
                data-date={entry.date}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: C.textMuted, marginBottom: 8,
                  fontFamily: FONT_HEADING,
                }}>
                  {formatDateFull(entry.date)}
                </div>
                {entry.items.map((item, i) => {
                  const Icon = CAT_ICONS[item.category];
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center",
                      gap: 8, fontSize: 12, marginBottom: 4,
                      paddingLeft: 2,
                    }}>
                      <Icon size={13} color={CAT_COLORS[item.category]} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <span style={{ color: C.textMuted }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function navBtn(C: ReturnType<typeof useTheme>) {
  return {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.textMuted,
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FONT_MONO,
  } as const;
}
