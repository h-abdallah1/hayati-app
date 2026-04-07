"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { isLeapYear, dayOfYear, MONTH_NAMES, DAY_INITIALS, SHOW_DAY, monthStartCols } from "../helpers";

export function GymHeatmap({ workouts, year }: { workouts: HevyWorkoutFull[]; year: number }) {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [sq, setSq]           = useState(10);
  const [hovDate, setHovDate] = useState<string | null>(null);
  const [mouse,   setMouse]   = useState({ x: 0, y: 0 });
  const GAP = 3; const DL_W = 10; const DL_G = 6;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSq(Math.min(11, Math.max(6, Math.floor((el.offsetWidth - DL_W - DL_G - 52 * GAP) / 53))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const workoutMap = useMemo(() => {
    const map = new Map<string, HevyWorkoutFull>();
    for (const w of workouts) if (!map.has(w.date)) map.set(w.date, w);
    return map;
  }, [workouts]);

  const workoutDates = useMemo(() => new Set(workouts.map(w => w.date)), [workouts]);

  const now      = new Date();
  const today    = now.toISOString().split("T")[0];
  const curYear  = now.getFullYear();
  const leap     = isLeapYear(year);
  const total    = leap ? 366 : 365;
  const todayDOY = year === curYear ? dayOfYear(now) : year < curYear ? total + 1 : 0;
  const jan1DOW  = new Date(year, 0, 1).getDay();
  const mCols    = monthStartCols(jan1DOW, leap);
  const step     = sq + GAP;
  const BR       = Math.max(1, Math.round(sq * 0.2));
  const pulse    = Math.max(2, Math.round(sq * 0.35));
  const toStr    = (d: number) => new Date(year, 0, d).toISOString().split("T")[0];

  const hovWorkout = hovDate ? workoutMap.get(hovDate) ?? null : null;
  const outerW     = outerRef.current?.offsetWidth ?? 600;

  return (
    <div ref={outerRef} style={{ marginBottom: 28, position: "relative" }}
      onMouseMove={e => {
        const rect = outerRef.current?.getBoundingClientRect();
        if (rect) setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setHovDate(null)}>
      <style>{`
        @keyframes gymPulse{0%,100%{box-shadow:0 0 0 0px ${C.accent}60;}55%{box-shadow:0 0 0 ${pulse}px ${C.accent}1e;}}
        .gym-today{animation:gymPulse 2.6s ease-in-out infinite;}
      `}</style>
      <div ref={wrapRef} style={{ width: "100%" }}>
        <div style={{ paddingLeft: DL_W + DL_G, position: "relative", height: 14, marginBottom: 5 }}>
          {mCols.map((col, m) => (
            <span key={m} style={{ position: "absolute", left: col * step, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, userSelect: "none" }}>
              {MONTH_NAMES[m].slice(0, 3).toLowerCase()}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: DL_G, alignItems: "flex-start" }}>
          <div style={{ display: "grid", gridTemplateRows: `repeat(7,${sq}px)`, gap: GAP, width: DL_W, flexShrink: 0 }}>
            {DAY_INITIALS.map((l, i) => (
              <div key={i} style={{ height: sq, display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: Math.min(9, Math.max(7, Math.round(sq * 0.65))), color: SHOW_DAY.has(i) ? C.textFaint : "transparent", userSelect: "none" }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateRows: `repeat(7,${sq}px)`, gridAutoColumns: `${sq}px`, gridAutoFlow: "column", gap: GAP }}>
            {Array.from({ length: jan1DOW }).map((_, i) => <div key={`o${i}`} style={{ width: sq, height: sq }} />)}
            {Array.from({ length: total }).map((_, i) => {
              const d       = i + 1;
              const dateStr = toStr(d);
              const isToday = d === todayDOY;
              const trained = workoutDates.has(dateStr);
              const isPast  = d < todayDOY;
              const isHov   = hovDate === dateStr;
              return (
                <div
                  key={d}
                  className={isToday ? "gym-today" : undefined}
                  onMouseEnter={() => (isPast || isToday) && setHovDate(dateStr)}
                  style={{
                    width: sq, height: sq, borderRadius: BR,
                    cursor: (isPast || isToday) ? "pointer" : "default",
                    background: isToday
                      ? (trained ? C.accent : C.borderHi)
                      : trained
                        ? `${C.accent}80`
                        : isPast ? C.border : `${C.border}55`,
                    outline: isHov ? `2px solid ${C.accent}` : "none",
                    outlineOffset: 1,
                    transition: "outline 0.1s",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hovDate && (
        <div style={{
          position: "absolute",
          left: mouse.x > outerW - 180 ? mouse.x - 170 : mouse.x + 14,
          top: mouse.y - 10,
          background: isDark ? "rgba(14, 14, 22, 0.82)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: `1px solid ${C.borderHi}`,
          borderRadius: 8,
          padding: "10px 14px",
          pointerEvents: "none",
          zIndex: 50,
          minWidth: 160,
          boxShadow: `0 4px 20px ${C.bg}99`,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {new Date(hovDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          {hovWorkout ? (
            <>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{hovWorkout.title}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted }}>
                {hovWorkout.duration} min
                <span style={{ color: C.textFaint, margin: "0 5px" }}>·</span>
                {hovWorkout.exercises.length} exercise{hovWorkout.exercises.length !== 1 ? "s" : ""}
              </div>
              {hovDate === today && (
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.accent, marginTop: 5 }}>✓ trained today</div>
              )}
            </>
          ) : (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>rest day</div>
          )}
        </div>
      )}
    </div>
  );
}
