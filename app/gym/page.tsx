"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { isLeapYear, dayOfYear, calcStreak, GOAL } from "./helpers";
import { GymHeatmap } from "./components/GymHeatmap";
import { WorkoutRow } from "./components/WorkoutRow";
import { Pager, GymSkeleton } from "./components/shared";
import { OverviewTab } from "./tabs/OverviewTab";
import { ExercisesTab } from "./tabs/ExercisesTab";
import { VolumeTab } from "./tabs/VolumeTab";
import { PRsTab } from "./tabs/PRsTab";
import { SplitTab } from "./tabs/SplitTab";

type Lifetime = { totalSessions: number; totalHrs: number; longestStreak: number; firstDate: string | null };
type Tab      = "overview" | "sessions" | "exercises" | "volume" | "prs" | "split";

const PAGE_SIZE = 10;
const TABS: { key: Tab; label: string }[] = [
  { key: "overview",  label: "Overview"  },
  { key: "sessions",  label: "Sessions"  },
  { key: "exercises", label: "Exercises" },
  { key: "volume",    label: "Volume"    },
  { key: "prs",       label: "PRs"       },
  { key: "split",     label: "Split"     },
];

export default function GymPage() {
  const C       = useTheme();
  const curYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(curYear);
  const [tab,          setTab]          = useState<Tab>("overview");
  const [page,         setPage]         = useState(1);
  const [lifetime,  setLifetime]  = useState<Lifetime | null>(null);
  const [workouts,  setWorkouts]  = useState<HevyWorkoutFull[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [wxLoading, setWxLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hevy/lifetime").then(r => r.json()).then(l => { if (!l.error) setLifetime(l); });
  }, []);

  const [selectedEx, setSelectedEx] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setSelectedEx(null);
    setWxLoading(true);
    fetch(`/api/hevy/workouts?year=${selectedYear}`).then(r => r.json()).then(w => {
      const loaded: HevyWorkoutFull[] = w.workouts ?? [];
      setWorkouts(loaded);
      setLoading(false); setWxLoading(false);
      // Cache exercise names for global search
      try {
        const names = [...new Set(loaded.flatMap(wx => wx.exercises.map(ex => ex.title)))];
        localStorage.setItem("hayati-gym-exercises", JSON.stringify(names));
      } catch {}
    }).catch(() => { setLoading(false); setWxLoading(false); });
  }, [selectedYear]);

  // Auto-open exercise chart when navigated from search (?ex=Name)
  useEffect(() => {
    if (workouts.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const ex = params.get("ex");
    if (ex) {
      setTab("exercises");
      setSelectedEx(decodeURIComponent(ex));
      window.history.replaceState({}, "", "/gym");
    }
  }, [workouts]);

  const firstYear  = lifetime?.firstDate ? parseInt(lifetime.firstDate.slice(0, 4), 10) : curYear;
  const years      = Array.from({ length: curYear - firstYear + 1 }, (_, i) => curYear - i);
  const dates      = workouts.map(w => w.date);
  const workoutSet = new Set(dates);
  const count      = workouts.length;
  const today      = new Date().toISOString().split("T")[0];
  const loggedToday = selectedYear === curYear && workoutSet.has(today);
  const streak      = selectedYear === curYear ? calcStreak(dates) : 0;
  const progress    = Math.min(100, (count / GOAL) * 100);
  const now         = new Date();
  const weeksInYear = selectedYear === curYear
    ? Math.max(1, Math.ceil((dayOfYear(now) + new Date(curYear, 0, 1).getDay()) / 7))
    : 52;
  const avgPerWeek = (count / weeksInYear).toFixed(1);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>GYM</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>رياضة</span>
            {loggedToday && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, marginLeft: 14 }}>✓ trained today</span>}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "all-time",       value: lifetime ? String(lifetime.totalSessions) : "—", unit: "sessions" },
              { label: "total time",     value: lifetime ? String(lifetime.totalHrs)      : "—", unit: "hrs"      },
              { label: "longest streak", value: lifetime ? String(lifetime.longestStreak) : "—", unit: "wks"      },
              { label: "since",          value: lifetime?.firstDate ? new Date(lifetime.firstDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", unit: "" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: C.text, lineHeight: 1 }}>
                  {s.value}{s.unit && <span style={{ fontSize: 9, color: C.textFaint, marginLeft: 3 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Year nav + content */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Year sidebar */}
          <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                color: selectedYear === y ? C.accent : C.textFaint,
                padding: "5px 0", textAlign: "center", width: "100%", borderRadius: 4, letterSpacing: "0.5px",
              }}>{y}</button>
            ))}
          </div>

          {/* Main */}
          <div style={{ flex: 1, minWidth: 0, opacity: !loading && wxLoading ? 0.4 : 1, transition: "opacity 0.2s ease", pointerEvents: !loading && wxLoading ? "none" : "auto" }}>

            {loading ? <GymSkeleton C={C} /> : (<>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { label: "sessions",   value: String(count),   sub: selectedYear === curYear ? `/ ${GOAL}` : undefined, hi: true },
                ...(selectedYear === curYear ? [{ label: "streak",    value: String(streak), sub: "days",     hi: false }] : []),
                { label: "avg / week", value: avgPerWeek,       sub: "sessions", hi: false },
                ...(selectedYear === curYear ? [{ label: "remaining", value: String(Math.max(0, GOAL - count)), sub: "left", hi: false }] : []),
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: s.hi ? C.accent : C.text, lineHeight: 1 }}>
                    {s.value}
                    {s.sub && <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 4 }}>{s.sub}</span>}
                  </div>
                </div>
              ))}
            </div>

            {selectedYear === curYear && (
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 28 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: C.accent, borderRadius: 2, boxShadow: `0 0 10px ${C.accent}55`, transition: "width .4s" }} />
              </div>
            )}

            <GymHeatmap workouts={workouts} year={selectedYear} />

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  color: tab === t.key ? C.accent : C.textFaint,
                  padding: "6px 12px", borderRadius: "4px 4px 0 0",
                  borderBottom: `2px solid ${tab === t.key ? C.accent : "transparent"}`,
                  marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "overview"  && <OverviewTab  workouts={workouts} count={count} streak={streak} avgPerWeek={avgPerWeek} progress={progress} selectedYear={selectedYear} C={C} />}
            {tab === "sessions"  && (() => {
              const pageCount = Math.ceil(count / PAGE_SIZE);
              const paged     = workouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
                      {wxLoading ? "loading…" : `${count} sessions in ${selectedYear}`}
                    </span>
                    <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
                  </div>
                  <div>{paged.map(w => <WorkoutRow key={w.id} w={w} C={C} />)}</div>
                  {!wxLoading && count === 0 && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>no data</div>}
                  {pageCount > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                      <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
                    </div>
                  )}
                </>
              );
            })()}
            {tab === "exercises" && <ExercisesTab workouts={workouts} C={C} selectedEx={selectedEx} setSelectedEx={setSelectedEx} />}
            {tab === "volume"    && <VolumeTab    workouts={workouts} C={C} />}
            {tab === "prs"       && <PRsTab       workouts={workouts} C={C} onSelectEx={title => { setSelectedEx(title); setTab("exercises"); }} />}
            {tab === "split"     && <SplitTab     workouts={workouts} C={C} />}

            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}
