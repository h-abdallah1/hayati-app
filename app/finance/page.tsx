"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import type { Transaction } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MonthlyChart({ txns, year, C }: { txns: Transaction[]; year: number; C: ReturnType<typeof useTheme> }) {
  const data = MONTHS.map((label, m) => {
    const month = txns.filter(t => {
      const d = new Date(t.date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === m;
    });
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

export default function FinancePage() {
  const C = useTheme();
  const now = new Date();

  const [txns,     setTxns]    = useState<Transaction[]>(INITIAL);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth,setViewMonth]= useState(now.getMonth());

  // Add form state
  const [amount,  setAmount]  = useState("");
  const [desc,    setDesc]    = useState("");
  const [cat,     setCat]     = useState("");
  const [txType,  setTxType]  = useState<"in" | "out">("out");
  const [date,    setDate]    = useState(now.toISOString().split("T")[0]);

  // Category filter
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => { setTxns(load()); }, []);

  const update = (next: Transaction[]) => { setTxns(next); persist(next); };

  const add = () => {
    const amt = parseFloat(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) return;
    update([...txns, {
      id: Date.now(), amount: amt,
      category: cat.trim() || "other",
      description: desc.trim() || "-",
      date, type: txType,
    }]);
    setAmount(""); setDesc(""); setCat("");
  };

  const remove = (id: number) => update(txns.filter(t => t.id !== id));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthTxns = txns
    .filter(t => {
      const d = new Date(t.date + "T00:00:00");
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    })
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

  const inputStyle: React.CSSProperties = {
    background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 6,
    padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11, color: C.text, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>FINANCE</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>مالية</span>
          </div>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.textFaint, padding: "0 4px" }}>‹</button>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted, minWidth: 80, textAlign: "center" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.textFaint, padding: "0 4px" }}>›</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "income",   val: `+${fmt(income)}`,                        color: C.teal  },
            { label: "expenses", val: `-${fmt(expenses)}`,                      color: C.red   },
            { label: "net",      val: `${net >= 0 ? "+" : ""}${fmt(net)}`,      color: net >= 0 ? C.accent : C.red },
          ].map(s => (
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
        <MonthlyChart txns={txns} year={viewYear} C={C} />

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

        {/* Add form */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* in / out toggle */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {(["in", "out"] as const).map(t => (
                <button key={t} onClick={() => setTxType(t)} style={{
                  background: txType === t ? (t === "in" ? C.teal : C.red) + "22" : "none",
                  border: `1px solid ${txType === t ? (t === "in" ? C.teal : C.red) : C.border}`,
                  borderRadius: 5, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: txType === t ? (t === "in" ? C.teal : C.red) : C.textFaint,
                  padding: "4px 10px", letterSpacing: "0.5px",
                }}>
                  {t}
                </button>
              ))}
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="amount"
              onKeyDown={e => e.key === "Enter" && add()}
              style={{ ...inputStyle, width: 90 }} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="description"
              onKeyDown={e => e.key === "Enter" && add()}
              style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
            <input value={cat} onChange={e => setCat(e.target.value)} placeholder="category"
              onKeyDown={e => e.key === "Enter" && add()}
              style={{ ...inputStyle, width: 100 }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, width: 136, colorScheme: "dark" }} />
            <button onClick={add} style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: 6,
              cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10, color: C.accent, padding: "6px 14px", flexShrink: 0,
            }}>
              add
            </button>
          </div>
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

      </div>
    </div>
  );
}
