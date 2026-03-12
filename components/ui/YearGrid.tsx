"use client";

import { useRef, useEffect, useState, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Dumbbell, Clapperboard, FileText, GitMerge, BookOpen, Flame } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { buildYearDays, getMonthStartCols, toDateKey, type ActivityCategory } from "@/app/overview/helpers";

// ── Shared constants ────────────────────────────────────────────────────────

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_COLOR = "#ff6b00";

export const CAT_COLORS: Record<ActivityCategory, string> = {
  gym:     "#4a9eff",
  film:    "#ff6b6b",
  note:    "#f5a623",
  commit:  "#22c55e",
  reading: "#a78bfa",
};

export const CAT_ICONS = {
  gym:     Dumbbell,
  film:    Clapperboard,
  note:    FileText,
  commit:  GitMerge,
  reading: BookOpen,
} as const;

export const ORDERED_CATS: ActivityCategory[] = ["gym", "film", "note", "commit", "reading"];

export function buildStreakSet(dates: string[]): Set<string> {
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

// ── Component ────────────────────────────────────────────────────────────────

interface YearGridProps {
  year: number;
  activityMap: Map<string, Set<ActivityCategory>>;
  streakSet: Set<string>;
  streakTipKey: string | null;
  // sizing
  cell?: number;           // fixed cell px (default 18); ignored when fluid
  gap?: number;            // default 5
  dowWidth?: number;       // default 28
  fluid?: boolean;         // default false; enables 1fr + ResizeObserver
  // style tweaks
  monthLabelLower?: boolean;
  streakBorderWidth?: number; // default 1.5
  // interactivity (all optional)
  onCellClick?: (dateKey: string, hasActivity: boolean) => void;
  tooltipContent?: (dateKey: string) => ReactNode;
}

export function YearGrid({
  year,
  activityMap,
  streakSet,
  streakTipKey,
  cell = 18,
  gap = 5,
  dowWidth = 28,
  fluid = false,
  monthLabelLower = false,
  streakBorderWidth = 1.5,
  onCellClick,
  tooltipContent,
}: YearGridProps) {
  const C = useTheme();

  const days      = buildYearDays(year);
  const jan1      = new Date(year, 0, 1);
  const jan1dow   = (jan1.getDay() + 6) % 7; // Mon=0
  const totalCols = Math.ceil((days.length + jan1dow) / 7);
  const monthCols = getMonthStartCols(year);
  const todayKey  = toDateKey(new Date());

  // Internal tooltip state
  const [tooltip, setTooltip] = useState<{ x: number; y: number; dateKey: string } | null>(null);

  // Fluid sizing via ResizeObserver
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(cell);
  const [sq, setSq]         = useState(fluid ? 11 : cell);

  useEffect(() => {
    if (!fluid) return;
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const actualCellW = (el.offsetWidth - dowWidth - totalCols * gap) / totalCols;
      setCellPx(Math.max(1, actualCellW));
      const colW = (el.offsetWidth - dowWidth - gap) / 53;
      setSq(Math.max(6, Math.min(14, Math.floor(colW))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fluid, dowWidth, gap, totalCols]);

  const effectiveCellPx = fluid ? cellPx : cell;
  const effectiveSq     = fluid ? sq : cell;
  const BR              = fluid ? Math.max(1, Math.round(effectiveSq * 0.2)) : 2;

  const colTemplate = fluid
    ? `${dowWidth}px repeat(${totalCols}, 1fr)`
    : `${dowWidth}px repeat(${totalCols}, ${cell}px)`;

  // Streak overlay rects (column segments of contiguous streak days)
  const streakGroups = useMemo(() => {
    const groups: { col: number; startRow: number; endRow: number }[] = [];
    for (let col = 0; col < totalCols; col++) {
      let start: number | null = null;
      for (let row = 0; row < 7; row++) {
        const di = col * 7 + row - jan1dow;
        const inStreak = di >= 0 && di < days.length && streakSet.has(toDateKey(days[di]));
        if (inStreak) {
          if (start === null) start = row;
        } else if (start !== null) {
          groups.push({ col, startRow: start, endRow: row - 1 });
          start = null;
        }
      }
      if (start !== null) groups.push({ col, startRow: start, endRow: 6 });
    }
    return groups;
  }, [streakSet, totalCols, days, jan1dow]);

  const wrapper = (
    <div style={{ position: "relative" }}>
      {DOW_LABELS.map((dow, rowIdx) => (
        <div key={rowIdx} style={{
          display: "grid",
          gridTemplateColumns: colTemplate,
          gap: `${gap}px`,
          marginBottom: rowIdx === 6 ? 0 : gap,
        }}>
          {/* DOW label */}
          <div style={{
            fontSize: fluid ? 9 : 10,
            color: C.textFaint,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 4,
            userSelect: "none",
            visibility: rowIdx % 2 === 0 ? "visible" : "hidden",
            ...(fluid ? { aspectRatio: "1" } : { height: cell }),
          }}>
            {dow}
          </div>

          {/* Cells */}
          {Array.from({ length: totalCols }, (_, colIdx) => {
            const dayIndex = colIdx * 7 + rowIdx - jan1dow;
            if (dayIndex < 0 || dayIndex >= days.length) {
              return <div key={colIdx} style={fluid ? { aspectRatio: "1" } : { width: cell, height: cell }} />;
            }
            const dateKey    = toDateKey(days[dayIndex]);
            const cats       = activityMap.get(dateKey);
            const activeCats = cats ? ORDERED_CATS.filter(c => cats.has(c)) : [];
            const hasActivity = activeCats.length > 0;
            const isToday    = dateKey === todayKey;
            const isStreak   = streakSet.has(dateKey);
            const isStreakTip = dateKey === streakTipKey;

            const borderPaint = (() => {
              if (isStreak) return C.border;
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
                onClick={onCellClick ? () => onCellClick(dateKey, hasActivity) : undefined}
                onMouseEnter={tooltipContent ? (e) => {
                  if (hasActivity) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ x: rect.left, y: rect.bottom + 4, dateKey });
                  }
                } : undefined}
                onMouseLeave={tooltipContent ? () => setTooltip(null) : undefined}
                style={{
                  ...(fluid ? { aspectRatio: "1" } : { width: cell, height: cell }),
                  borderRadius: BR,
                  background: borderPaint,
                  padding: 1,
                  cursor: hasActivity && onCellClick ? "pointer" : "default",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <div style={{
                  width: "100%", height: "100%",
                  borderRadius: Math.max(0, BR - 1),
                  background: C.surface,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                }}>
                  {activeCats.length === 1 ? (() => {
                    const Icon = CAT_ICONS[activeCats[0]];
                    const sz = fluid ? Math.max(5, effectiveSq - 4) : 11;
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
                        const sz = fluid ? Math.max(4, Math.floor(effectiveSq / 2) - 1) : 6;
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
                </div>
                {isStreakTip && (
                  <Flame
                    size={fluid ? Math.max(5, effectiveSq - 5) : 13}
                    color={STREAK_COLOR}
                    strokeWidth={2}
                    style={{
                      position: "absolute",
                      top: fluid ? -4 : -5,
                      right: fluid ? -4 : -5,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Streak overlays */}
      {streakGroups.map(({ col, startRow, endRow }) => (
        <div key={`sg-${col}-${startRow}`} style={{
          position: "absolute",
          pointerEvents: "none",
          left: dowWidth + gap + col * (effectiveCellPx + gap),
          top: startRow * (effectiveCellPx + gap),
          width: effectiveCellPx,
          height: (endRow - startRow + 1) * effectiveCellPx + (endRow - startRow) * gap,
          border: `${streakBorderWidth}px solid ${STREAK_COLOR}`,
          borderRadius: BR,
        }} />
      ))}
    </div>
  );

  return (
    <div ref={fluid ? gridRef : undefined} style={fluid ? { width: "100%", overflow: "hidden" } : undefined}>
      {/* Month labels */}
      <div style={{
        display: "grid",
        gridTemplateColumns: colTemplate,
        gap: `0 ${gap}px`,
        marginBottom: 4,
      }}>
        <div />
        {Array.from({ length: totalCols }, (_, col) => {
          const mc = monthCols.find(m => m.col === col);
          const label = mc ? (monthLabelLower ? mc.label.toLowerCase() : mc.label) : "";
          return (
            <div key={col} style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: fluid ? 9 : 10,
              color: mc ? (fluid ? C.textFaint : C.textMuted) : "transparent",
              whiteSpace: "nowrap",
              overflow: "visible",
              userSelect: "none",
            }}>
              {label}
            </div>
          );
        })}
      </div>

      {wrapper}

      {tooltip && tooltipContent && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", left: tooltip.x, top: tooltip.y, pointerEvents: "none", zIndex: 9999 }}>
          {tooltipContent(tooltip.dateKey)}
        </div>,
        document.body
      )}
    </div>
  );
}
