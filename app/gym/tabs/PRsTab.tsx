"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Pager, Stat, Empty } from "../components/shared";

const PR_PAGE = 10;

type PR = { title: string; weight: number; reps: number; date: string; orm: number };

export function PRsTab({ selectedYear, C, onSelectEx }: {
  selectedYear: number;
  C: ReturnType<typeof useTheme>;
  onSelectEx: (title: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [prs,  setPrs]  = useState<PR[]>([]);

  useEffect(() => {
    setPage(1);
    setPrs([]);
    fetch(`/api/hevy/analytics/prs?year=${selectedYear}`)
      .then(r => r.json())
      .then(d => setPrs(d.prs ?? []))
      .catch(() => {});
  }, [selectedYear]);

  const pageCount = Math.ceil(prs.length / PR_PAGE);
  const paged     = prs.slice((page - 1) * PR_PAGE, page * PR_PAGE);
  const offset    = (page - 1) * PR_PAGE;

  if (!prs.length) return <Empty C={C} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          {prs.length} exercises
        </span>
        <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {paged.map((pr, i) => (
          <div key={pr.title}
            onClick={() => onSelectEx(pr.title)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < paged.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, width: 20, textAlign: "right", flexShrink: 0 }}>{offset + i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.title}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 2 }}>
                {new Date(pr.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              <Stat label="weight"  value={`${pr.weight}kg`} C={C} hi />
              <Stat label="reps"    value={String(pr.reps)}   C={C} />
              <Stat label="est 1RM" value={`${pr.orm}kg`}     C={C} />
            </div>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
        </div>
      )}
    </div>
  );
}
