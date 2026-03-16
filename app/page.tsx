"use client";

import React from "react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useClock } from "@/lib/hooks";
import { useGlobalSettings } from "@/lib/settings";
import { isRouteDisabled, MODULES } from "@/lib/modules";
import { NAV_ITEMS, FONT_MONO, FONT_HEADING, FONT_ARABIC, getGreeting } from "@/lib/constants";
import { Search, Target, Dumbbell } from "lucide-react";

const SECTIONS = NAV_ITEMS.filter(n => n.href !== "/");

type Result = { label: string; sub: string; href: string; kind: string; Icon: React.ElementType };

const PAGE_RESULTS: Result[] = SECTIONS.map(s => ({ label: s.label, sub: s.desc ?? "", href: s.href, kind: "page", Icon: s.Icon }));

function NavCard({ href, Icon, label, desc }: typeof SECTIONS[0]) {
  const C = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "14px 16px",
        background: hovered ? C.surfaceHi : C.surface,
        border: `1px solid ${hovered ? C.borderHi : C.border}`,
        borderRadius: 10,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <Icon size={16} color={C.accent} strokeWidth={1.8} />
      <div>
        <div style={{ fontFamily: FONT_HEADING, fontSize: 12, fontWeight: 700, color: C.text }}>
          {label}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginTop: 2 }}>
          {desc}
        </div>
      </div>
    </Link>
  );
}

function InlineSearch() {
  const C = useTheme();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [focused, setFocused] = useState(false);
  const [goals, setGoals] = useState<{ title: string; status: string }[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);

  useEffect(() => {
    try { const s = localStorage.getItem("hayati-goals");         if (s) setGoals(JSON.parse(s));     } catch {}
    try { const s = localStorage.getItem("hayati-gym-exercises"); if (s) setExercises(JSON.parse(s)); } catch {}
  }, []);

  const q = query.toLowerCase().trim();
  const results: Result[] = q === "" ? [] : [
    ...PAGE_RESULTS.filter(p => p.label.toLowerCase().includes(q)),
    ...goals
      .filter(g => g.title.toLowerCase().includes(q))
      .map(g => ({ kind: "goal", label: g.title, sub: g.status, href: "/goals", Icon: Target })),
    ...exercises
      .filter(e => e.toLowerCase().includes(q))
      .map(e => ({ kind: "exercise", label: e, sub: "gym", href: `/gym?ex=${encodeURIComponent(e)}`, Icon: Dumbbell })),
  ];

  const clampedSel = Math.min(sel, Math.max(0, results.length - 1));
  const open = focused && query.length > 0;

  const navigate = (r: Result) => {
    setQuery("");
    setFocused(false);
    router.push(r.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape")    { setQuery(""); setFocused(false); }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[clampedSel]) navigate(results[clampedSel]);
  };

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: C.surface,
        border: `1px solid ${focused ? C.borderHi : C.border}`,
        borderRadius: open ? "8px 8px 0 0" : 8,
        transition: "border-color 0.15s",
      }}>
        <Search size={13} color={C.textFaint} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSel(0); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={onKey}
          placeholder="Search pages, goals, exercises…"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: FONT_MONO,
            fontSize: 12,
            color: C.text,
          }}
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(""); inputRef.current?.focus(); }}
            style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 9, padding: 0 }}
          >
            clear
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute",
          left: 0, right: 0,
          background: C.surface,
          border: `1px solid ${C.borderHi}`,
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          maxHeight: 240,
          overflowY: "auto",
          zIndex: 50,
        }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>
              no results
            </div>
          ) : results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => navigate(r)}
              onMouseEnter={() => setSel(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                background: i === clampedSel ? C.surfaceHi : "transparent",
                cursor: "pointer",
                borderTop: i > 0 ? `1px solid ${C.border}` : "none",
              }}
            >
              <r.Icon size={13} strokeWidth={1.7} color={i === clampedSel ? C.accent : C.textFaint} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.label}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textFaint, flexShrink: 0 }}>
                {r.sub}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const C = useTheme();
  const time = useClock();
  const { global } = useGlobalSettings();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 32px",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: FONT_ARABIC, fontSize: 52, color: C.accent, lineHeight: 1 }}>
            ح
          </div>
          <div style={{ fontFamily: FONT_HEADING, fontSize: 32, fontWeight: 800, color: C.text, marginTop: 8 }}>
            Hayati
          </div>
          <div style={{ fontFamily: FONT_ARABIC, fontSize: 18, color: C.textMuted, marginTop: 4 }}>
            حياتي
          </div>
          <div style={{ width: 40, height: 1, background: C.border, margin: "16px auto" }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textFaint }}>
            {getGreeting(time)}, {global.name}
          </div>
        </div>

        <InlineSearch />

        {/* Nav grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 8,
        }}>
          {(() => {
            const ALWAYS = new Set(["/dashboard"]);
            const order = global.moduleOrder;
            const visible = SECTIONS
              .filter(s => ALWAYS.has(s.href) || !isRouteDisabled(s.href, global.disabledModules))
              .sort((a, b) => {
                if (ALWAYS.has(a.href) && ALWAYS.has(b.href)) return 0;
                if (ALWAYS.has(a.href)) return -1;
                if (ALWAYS.has(b.href)) return 1;
                const ai = order.indexOf(MODULES.find(m => m.route === a.href)?.id ?? "");
                const bi = order.indexOf(MODULES.find(m => m.route === b.href)?.id ?? "");
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
              });
            return visible.map(s => <NavCard key={s.href} {...s} />);
          })()}
        </div>
      </div>
    </div>
  );
}
