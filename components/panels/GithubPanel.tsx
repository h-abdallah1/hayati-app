"use client";

import { useRef } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useGithub } from "@/lib/hooks/useGithub";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag, Dot } from "@/components/ui";
import type { GithubDay } from "@/lib/types";

const CELL = 10;
const GAP  = 2;

/** Color scale for contribution counts */
function commitColor(count: number, borderColor: string): string {
  if (count === 0)  return "transparent";
  if (count <= 2)   return "#166534";
  if (count <= 5)   return "#15803d";
  return "#22c55e";
}

/** Compute longest streak from all days (not just filtered) */
function longestStreak(days: GithubDay[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days.map(d => d.date));
  let max = 0;
  let cur = 0;
  // walk day by day for an arbitrary span is expensive; use sorted unique dates instead
  const sorted = [...set].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { cur = 1; max = 1; continue; }
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

/** Build a 12×7 heatmap grid from the last 84 days */
function buildHeatmap(days: GithubDay[]): { date: string; count: number }[][] {
  const countMap = new Map(days.map(d => [d.date, d.count]));
  const today = new Date();
  // Snap to the most recent Sunday so columns end on a full week
  const dow = today.getDay(); // 0=Sun
  const end = new Date(today);
  end.setDate(end.getDate() - dow); // last Sunday

  const cols: { date: string; count: number }[][] = [];
  for (let col = 11; col >= 0; col--) {
    const colDays: { date: string; count: number }[] = [];
    for (let row = 0; row < 7; row++) {
      const d = new Date(end);
      d.setDate(end.getDate() - col * 7 + row);
      const key = d.toISOString().slice(0, 10);
      colDays.push({ date: key, count: countMap.get(key) ?? 0 });
    }
    cols.push(colDays);
  }
  return cols;
}

export function GithubPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const { global } = useGlobalSettings();
  const username = global.githubUsername ?? "";
  const token = global.githubToken ?? "";
  const { days, total, loaded } = useGithub(username, token);

  const compact = height > 0 && height < 200;
  const streak  = longestStreak(days);
  const cols    = buildHeatmap(days);

  return (
    <Panel ref={ref} style={{ padding: compact ? 14 : 20 }}>
      {/* Header */}
      <div className="hayati-drag-handle" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: compact ? 8 : 14 }}>
        <Tag color={C.textFaint}>GitHub</Tag>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot size={4} />
          <Tag color={C.textMuted}>
            {!username ? "not configured" : loaded ? "live" : "loading"}
          </Tag>
        </div>
      </div>

      {!username ? (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>
          configure GitHub username in settings
        </span>
      ) : !loaded ? (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>loading...</span>
      ) : (
        <>
          {/* Total + streak */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: compact ? 0 : 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: compact ? 22 : 26, color: C.text, lineHeight: 1 }}>
                {total}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
                contributions this year
              </span>
            </div>
            {streak > 0 && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#22c55e" }}>
                ↑ {streak} day streak
              </span>
            )}
          </div>

          {/* Heatmap — only in expanded mode */}
          {!compact && (
            <div style={{ display: "flex", gap: GAP, overflowX: "auto" }}>
              {cols.map((col, ci) => (
                <div key={ci} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                  {col.map((cell, ri) => (
                    <div
                      key={ri}
                      title={`${cell.date}: ${cell.count} contributions`}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        background: commitColor(cell.count, C.border),
                        border: `1px solid ${cell.count === 0 ? C.border : "transparent"}`,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
