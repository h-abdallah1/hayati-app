"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import type { Transaction } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function cycleRange(year: number, month: number, paymentDay: number): { start: Date; end: Date } {
  if (paymentDay <= 1) {
    return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0, 23, 59, 59) };
  }
  // Cycle starts on paymentDay of previous month, ends on paymentDay-1 of current month
  return {
    start: new Date(year, month - 1, paymentDay),
    end:   new Date(year, month, paymentDay - 1, 23, 59, 59),
  };
}

function inCycle(dateStr: string, year: number, month: number, paymentDay: number): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const { start, end } = cycleRange(year, month, paymentDay);
  return d >= start && d <= end;
}

function MonthlyChart({ txns, year, paymentDay, C }: { txns: Transaction[]; year: number; paymentDay: number; C: ReturnType<typeof useTheme> }) {
  const data = MONTHS.map((label, m) => {
    const month = txns.filter(t => inCycle(t.date, year, m, paymentDay));
    const income   = month.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const expenses = month.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    return { label, income, expenses };
  });
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
        {year} — monthly
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
        {data.map(({ label, income, expenses }) => (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 44, width: "100%" }}>
              <div style={{ flex: 1, background: C.teal + "55", borderRadius: "2px 2px 0 0", height: `${(income / maxVal) * 100}%`, minHeight: income > 0 ? 2 : 0 }} title={`Income: ${fmt(income)}`} />
              <div style={{ flex: 1, background: C.red   + "55", borderRadius: "2px 2px 0 0", height: `${(expenses / maxVal) * 100}%`, minHeight: expenses > 0 ? 2 : 0 }} title={`Expenses: ${fmt(expenses)}`} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint }}>{label.slice(0,1)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.teal + "55" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint }}>income</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: C.red + "55" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint }}>expenses</span>
        </div>
      </div>
    </div>
  );
}

const INITIAL: Transaction[] = [
  { id: 1, amount: 4200,  category: "income",    description: "Monthly salary", date: "2026-03-01", type: "in"  },
  { id: 2, amount: 120,   category: "food",       description: "Groceries",      date: "2026-03-05", type: "out" },
  { id: 3, amount: 15.99, category: "subs",       description: "Netflix",        date: "2026-03-07", type: "out" },
  { id: 4, amount: 45,    category: "transport",  description: "Fuel",           date: "2026-03-10", type: "out" },
];

function load(): Transaction[] {
  try { const s = localStorage.getItem("hayati-finance"); if (s) return JSON.parse(s); } catch {}
  return INITIAL;
}
function persist(txns: Transaction[]) {
  try { localStorage.setItem("hayati-finance", JSON.stringify(txns)); } catch {}
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SmsImportRow = { amount: number; type: "in" | "out"; description: string; date: string; source: string; raw: string };

export default function FinancePage() {
  const C = useTheme();
  const { global: globalSettings, updateGlobal } = useGlobalSettings();
  const now = new Date();
  const hideIncome = globalSettings.financeHideIncome ?? false;

  const [txns,     setTxns]    = useState<Transaction[]>(INITIAL);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth,setViewMonth]= useState(now.getMonth());

  // Category filter
  const [catFilter, setCatFilter] = useState("all");

  // SMS import state
  const [importing,   setImporting]   = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [preview,     setPreview]     = useState<SmsImportRow[] | null>(null);
  const [selected,    setSelected]    = useState<Set<number>>(new Set());
  const [importDays,  setImportDays]  = useState("90");

  useEffect(() => { setTxns(load()); }, []);

  const update = (next: Transaction[]) => { setTxns(next); persist(next); };

  const remove = (id: number) => update(txns.filter(t => t.id !== id));

  const importFromSms = async () => {
    const smsConfig = globalSettings.smsConfig;
    if (!smsConfig?.enabled || !smsConfig.senders.length) {
      setImportError("SMS import is disabled or no senders configured. Enable it in Settings → General.");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const params = new URLSearchParams({ days: importDays || "90", senders: smsConfig.senders.join(",") });
      const res = await fetch(`/api/sms?${params}`);
      const data = await res.json() as { transactions: SmsImportRow[]; error?: string };
      if (data.error) { setImportError(data.error); return; }
      // Deduplicate against existing transactions
      const existingKeys = new Set(txns.map(t => `${t.date}_${t.amount}_${t.type}`));
      const fresh = data.transactions.filter(r => !existingKeys.has(`${r.date}_${r.amount}_${r.type}`));
      setPreview(fresh);
      setSelected(new Set(fresh.map((_, i) => i)));
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = () => {
    if (!preview) return;
    const toAdd: Transaction[] = preview
      .filter((_, i) => selected.has(i))
      .map(r => ({
        id: Date.now() + Math.random(),
        amount: r.amount,
        type: r.type,
        description: r.description,
        category: r.type === "in" ? "income" : "other",
        date: r.date,
      }));
    update([...txns, ...toAdd]);
    setPreview(null);
    setSelected(new Set());
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const paymentDay = globalSettings.paymentDay ?? 1;

  const monthTxns = txns
    .filter(t => inCycle(t.date, viewYear, viewMonth, paymentDay) && (!hideIncome || t.type === "out"))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Running balance (computed ascending, displayed descending)
  const monthAsc = [...monthTxns].reverse();
  let runBalance = 0;
  const balanceMap = new Map<number, number>();
  for (const t of monthAsc) {
    runBalance += t.type === "in" ? t.amount : -t.amount;
    balanceMap.set(t.id, runBalance);
  }

  // Category list for filter
  const allCats = ["all", ...Array.from(new Set(monthTxns.map(t => t.category))).sort()];
  const visible = catFilter === "all" ? monthTxns : monthTxns.filter(t => t.category === catFilter);

  const income   = monthTxns.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
  const net      = income - expenses;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>FINANCE</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>مالية</span>
          </div>
          {/* Controls */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => updateGlobal({ financeHideIncome: !hideIncome })}
              style={{
                background: hideIncome ? C.accentDim : "none",
                border: `1px solid ${hideIncome ? C.accentMid : C.border}`,
                borderRadius: 5, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: hideIncome ? C.accent : C.textFaint,
                padding: "4px 10px", letterSpacing: "0.3px",
              }}
            >
              spending only
            </button>
            <button
              onClick={() => { if (confirm("Clear all transactions?")) update([]); }}
              style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
                padding: "4px 10px", letterSpacing: "0.3px",
              }}
            >
              clear
            </button>
          </div>
          {/* Month nav + import */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.textFaint, padding: "0 4px" }}>‹</button>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted, minWidth: 80, textAlign: "center" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.textFaint, padding: "0 4px" }}>›</button>
            <input
              value={importDays}
              onChange={e => setImportDays(e.target.value.replace(/\D/g, ""))}
              style={{
                background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 5,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
                padding: "4px 6px", width: 36, textAlign: "center", outline: "none",
              }}
              title="days to look back"
            />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>d</span>
            <button
              onClick={importFromSms}
              disabled={importing}
              style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
                padding: "4px 10px", opacity: importing ? 0.5 : 1, letterSpacing: "0.3px",
              }}
            >
              {importing ? "importing…" : "import sms"}
            </button>
          </div>
        </div>

        {/* Cycle date range */}
        {paymentDay > 1 && (() => {
          const { start, end } = cycleRange(viewYear, viewMonth, paymentDay);
          const fmt2 = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, textAlign: "right", marginTop: -18, marginBottom: 18 }}>
              {fmt2(start)} – {fmt2(end)}
            </div>
          );
        })()}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: hideIncome ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {(hideIncome
            ? [{ label: "spent", val: `-${fmt(expenses)}`, color: C.red }]
            : [
                { label: "income",   val: `+${fmt(income)}`,               color: C.teal  },
                { label: "expenses", val: `-${fmt(expenses)}`,              color: C.red   },
                { label: "net",      val: `${net >= 0 ? "+" : ""}${fmt(net)}`, color: net >= 0 ? C.accent : C.red },
              ]
          ).map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "1px", marginBottom: 6, textTransform: "uppercase" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: s.color, fontWeight: 700 }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        <MonthlyChart txns={txns} year={viewYear} paymentDay={paymentDay} C={C} />

        {/* Category filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {allCats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              background: catFilter === c ? C.accentDim : "none",
              border: `1px solid ${catFilter === c ? C.accentMid : C.border}`,
              borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: catFilter === c ? C.accent : C.textFaint,
              padding: "3px 9px", letterSpacing: "0.3px",
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {visible.length === 0 && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>
              no transactions this month
            </div>
          )}
          {visible.map((t, i) => (
            <div
              key={t.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = ".75"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
            >
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, width: 52, flexShrink: 0 }}>
                {new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, flex: 1 }}>
                {t.description}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                {t.category}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: t.type === "in" ? C.teal : C.red, flexShrink: 0, minWidth: 80, textAlign: "right" }}>
                {t.type === "in" ? "+" : "−"}{fmt(t.amount)}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: (balanceMap.get(t.id) ?? 0) >= 0 ? C.teal : C.red, flexShrink: 0, minWidth: 70, textAlign: "right", opacity: 0.7 }}>
                {fmt(balanceMap.get(t.id) ?? 0)}
              </span>
              <button
                onClick={() => remove(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: 0, flexShrink: 0, opacity: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0"; }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Import error */}
        {importError && (
          <div style={{
            marginTop: 12, background: C.red + "15", border: `1px solid ${C.red}44`,
            borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.red, lineHeight: 1.6 }}>
              {importError}
            </span>
            <button onClick={() => setImportError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, fontSize: 12, flexShrink: 0, marginLeft: 10 }}>✕</button>
          </div>
        )}

      </div>

      {/* SMS preview modal */}
      {preview !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
            width: "min(600px, 96vw)", maxHeight: "80vh", display: "flex", flexDirection: "column",
            padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: "0.06em" }}>
                SMS IMPORT PREVIEW
              </span>
              <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, fontSize: 14 }}>✕</button>
            </div>

            {preview.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "32px 0" }}>
                no new transactions found (all already imported or no bank SMS matched)
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginBottom: 10 }}>
                  {selected.size} of {preview.length} selected — click to toggle
                </div>
                <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  {preview.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => setSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      })}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        borderRadius: 6, cursor: "pointer",
                        background: selected.has(i) ? C.accentDim : "transparent",
                        border: `1px solid ${selected.has(i) ? C.accentMid : "transparent"}`,
                        opacity: selected.has(i) ? 1 : 0.5,
                      }}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, width: 52, flexShrink: 0 }}>
                        {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.description}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: r.type === "in" ? C.teal : C.red, flexShrink: 0, minWidth: 70, textAlign: "right" }}>
                        {r.type === "in" ? "+" : "−"}{fmt(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setPreview(null)}
                    style={{
                      background: "none", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: "6px 14px",
                    }}
                  >
                    cancel
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={selected.size === 0}
                    style={{
                      background: C.accentDim, border: `1px solid ${C.accentMid}`, borderRadius: 6, cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, padding: "6px 14px",
                      opacity: selected.size === 0 ? 0.5 : 1,
                    }}
                  >
                    import {selected.size}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
