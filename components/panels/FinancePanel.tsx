"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import type { Transaction } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

function loadTxns(): Transaction[] {
  try { const s = localStorage.getItem("hayati-finance"); return s ? JSON.parse(s) : []; } catch { return []; }
}
function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function FinancePanel() {
  const C = useTheme();
  const [txns, setTxns] = useState<Transaction[]>([]);

  useEffect(() => { setTxns(loadTxns()); }, []);

  const { global: globalSettings } = useGlobalSettings();
  const now = new Date();
  const paymentDay = globalSettings.paymentDay ?? 1;

  // Cycle labeled "M" runs from paymentDay of M-1 to paymentDay-1 of M.
  // If today >= paymentDay a new cycle just started → label is next month.
  // If today < paymentDay we're still in the cycle labeled this month.
  const rawMonth  = now.getDate() >= paymentDay ? now.getMonth() + 1 : now.getMonth();
  const cycleYear = rawMonth > 11 ? now.getFullYear() + 1 : rawMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
  const adjMonth  = (rawMonth + 12) % 12;

  const cycleStart = paymentDay <= 1
    ? new Date(cycleYear, adjMonth, 1)
    : new Date(cycleYear, adjMonth - 1, paymentDay);
  const cycleEnd   = paymentDay <= 1
    ? new Date(cycleYear, adjMonth + 1, 0, 23, 59, 59)
    : new Date(cycleYear, adjMonth, paymentDay - 1, 23, 59, 59);

  const hideIncome = globalSettings.financeHideIncome ?? false;

  const monthTxns = txns.filter(t => {
    const d = new Date(t.date + "T00:00:00");
    return d >= cycleStart && d <= cycleEnd && (!hideIncome || t.type === "out");
  });
  const income   = monthTxns.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
  const net      = income - expenses;

  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tag color={C.textFaint}>Finance</Tag>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
          {new Date(cycleYear, adjMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Month summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        {(hideIncome
          ? [{ label: "spent", val: fmt(expenses), color: C.red }]
          : [
              { label: "income",   val: fmt(income),                          color: C.teal  },
              { label: "expenses", val: fmt(expenses),                        color: C.red   },
              { label: "net",      val: (net >= 0 ? "+" : "") + fmt(net),     color: net >= 0 ? C.accent : C.red },
            ]
        ).map(s => (
          <div key={s.label} style={{ flex: 1 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

    </Panel>
  );
}
