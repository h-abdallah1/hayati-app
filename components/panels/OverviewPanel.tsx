"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, Clapperboard, Target } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { Panel, Tag } from "@/components/ui";
import { load as loadGoals, goalYear } from "@/lib/goals";

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function dayOfYear(d: Date) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

export function OverviewPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const { global: settings } = useGlobalSettings();
  const { films } = useLetterboxd(settings.letterboxdUsername);

  const now = new Date();
  const year = now.getFullYear();
  const leap = isLeapYear(year);
  const total = leap ? 366 : 365;
  const today = dayOfYear(now);
  const pct = ((today / total) * 100).toFixed(1);
  const remaining = total - today;

  // Gym sessions this year
  const [gymCount, setGymCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/hevy")
      .then(r => r.json())
      .then(d => setGymCount(d.count ?? null))
      .catch(() => {});
  }, []);

  // Films this year
  const yearStart = `${year}-01-01`;
  const yearEnd   = `${year + 1}-01-01`;
  const filmCount = films.filter(f => f.watchedDate >= yearStart && f.watchedDate < yearEnd).length;

  // Goals this year
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);
  useEffect(() => {
    const all = loadGoals().filter(g => goalYear(g) === year);
    setGoalsTotal(all.length);
    setGoalsDone(all.filter(g => g.status === "done").length);
  }, [year]);

  const sm = height > 0 && height < 160;

  const statRow = [
    { icon: <Dumbbell size={10} strokeWidth={2} color={C.accent} />,      label: "gym",   val: gymCount ?? "—", href: "/gym"      },
    { icon: <Clapperboard size={10} strokeWidth={2} color="#ff6b6b" />,   label: "films", val: filmCount,       href: "/films"    },
    { icon: <Target size={10} strokeWidth={2} color={C.textMuted} />,     label: "goals", val: goalsTotal ? `${goalsDone}/${goalsTotal}` : "—", href: "/overview" },
  ];

  return (
    <Panel ref={ref} style={{ display: "flex", flexDirection: "column", padding: sm ? 14 : 20 }}>
      <div className="hayati-drag-handle" style={{ marginBottom: sm ? 8 : 14 }}>
        <Tag color={C.textFaint}>Overview</Tag>
      </div>

      {/* Big % */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: sm ? 8 : 12 }}>
        <span style={{
          fontFamily: "'Syne',sans-serif", fontSize: sm ? 28 : 42,
          fontWeight: 800, color: C.accent, lineHeight: 1,
        }}>
          {pct}%
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
          {year}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: sm ? 10 : 14 }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: C.accent, borderRadius: 2,
          boxShadow: `0 0 8px ${C.accent}55`,
          transition: "width .3s",
        }} />
      </div>

      {/* Day / remaining */}
      {!sm && (
        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
          {[
            { label: "day",       val: String(today),      unit: `/ ${total}` },
            { label: "remaining", val: String(remaining),  unit: "days"       },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: C.text, lineHeight: 1 }}>
                {s.val}
                <span style={{ fontSize: 9, marginLeft: 3, color: C.textFaint }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity stats */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: sm ? 8 : 12, marginTop: "auto", display: "flex", gap: sm ? 12 : 20 }}>
        {statRow.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {s.icon}{s.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: sm ? 14 : 18, color: C.textMuted, lineHeight: 1 }}>
              {s.val}
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
