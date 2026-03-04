"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { LayoutDashboard, Target, FileText, Wallet, Dumbbell, Newspaper, Clapperboard, Globe, Moon, Grid2X2, Home } from "lucide-react";
import type { Goal, Note } from "@/lib/types";

type Kind = "page" | "goal" | "note" | "exercise";
type Result = { kind: Kind; label: string; sub?: string; href: string; Icon: React.ElementType };

const PAGES: Result[] = [
  { kind: "page", label: "Home",      sub: "landing",  href: "/",          Icon: Home           },
  { kind: "page", label: "Dashboard", sub: "widgets",  href: "/dashboard", Icon: LayoutDashboard },
  { kind: "page", label: "Overview",  sub: "activity", href: "/overview",  Icon: Grid2X2        },
  { kind: "page", label: "Goals",     sub: "targets",  href: "/goals",     Icon: Target         },
  { kind: "page", label: "Notes",     sub: "writing",  href: "/notes",     Icon: FileText       },
  { kind: "page", label: "Finance",   sub: "money",    href: "/finance",   Icon: Wallet         },
  { kind: "page", label: "Gym",       sub: "fitness",  href: "/gym",       Icon: Dumbbell       },
  { kind: "page", label: "News",      sub: "rss",      href: "/news",      Icon: Newspaper      },
  { kind: "page", label: "Films",     sub: "log",      href: "/films",     Icon: Clapperboard   },
  { kind: "page", label: "Travel",    sub: "world",    href: "/travel",    Icon: Globe          },
  { kind: "page", label: "Prayer",    sub: "times",    href: "/prayer",    Icon: Moon           },
];

export function SearchPalette() {
  const C      = useTheme();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState("");
  const [sel,       setSel]       = useState(0);
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [notes,     setNotes]     = useState<Note[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);

  // Load data when opened
  useEffect(() => {
    if (!open) return;
    try { const s = localStorage.getItem("hayati-goals");         if (s) setGoals(JSON.parse(s));     } catch {}
    try { const s = localStorage.getItem("hayati-notes");         if (s) setNotes(JSON.parse(s));     } catch {}
    try { const s = localStorage.getItem("hayati-gym-exercises"); if (s) setExercises(JSON.parse(s)); } catch {}
    setQuery("");
    setSel(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  // Build filtered results
  const q = query.toLowerCase().trim();
  const results: Result[] = q === ""
    ? PAGES
    : [
        ...PAGES.filter(p => p.label.toLowerCase().includes(q)),
        ...goals
          .filter(g => g.title.toLowerCase().includes(q))
          .map(g => ({ kind: "goal" as Kind, label: g.title, sub: g.status, href: "/goals", Icon: Target })),
        ...notes
          .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
          .map(n => ({ kind: "note" as Kind, label: n.title, sub: n.content.slice(0, 50).replace(/\n/g, " "), href: "/notes", Icon: FileText })),
        ...exercises
          .filter(e => e.toLowerCase().includes(q))
          .map(e => ({ kind: "exercise" as Kind, label: e, sub: "gym", href: `/gym?ex=${encodeURIComponent(e)}`, Icon: Dumbbell })),
      ];

  const clampedSel = Math.min(sel, Math.max(0, results.length - 1));

  const navigate = useCallback((r: Result) => {
    router.push(r.href);
    setOpen(false);
  }, [router]);

  // Arrow / enter / esc while open
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape")    { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[clampedSel]) navigate(results[clampedSel]);
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[clampedSel] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedSel]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100, backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={onKey}
        style={{ background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 12, width: 540, maxHeight: 440, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: C.textFaint }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSel(0); }}
            placeholder="Search pages, goals, notes, exercises…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.text }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setSel(0); inputRef.current?.focus(); }}
              style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9 }}>
              clear
            </button>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 5px" }}>esc</span>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
          {results.length === 0 ? (
            <div style={{ padding: "32px 18px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center" }}>no results</div>
          ) : results.map((r, i) => (
            <div
              key={i}
              onClick={() => navigate(r)}
              onMouseEnter={() => setSel(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", background: i === clampedSel ? C.surfaceHi : "transparent", cursor: "pointer", transition: "background 0.1s" }}
            >
              <r.Icon size={13} strokeWidth={1.7} color={i === clampedSel ? C.accent : C.textFaint} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              {r.sub && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{r.sub}</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "7px 18px", display: "flex", gap: 16 }}>
          {([["↑↓", "navigate"], ["↵", "open"], ["⌘K", "toggle"]] as [string, string][]).map(([key, label]) => (
            <span key={label} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
              <span style={{ color: C.textMuted }}>{key}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
