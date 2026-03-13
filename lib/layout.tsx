"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import type { LayoutItem } from "react-grid-layout";

export type LayoutTemplate = {
  id: string;
  name: string;
  layout: LayoutItem[];
  savedAt: number;
};

const REMOVED_PANELS = new Set(["finance", "savings"]);

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "prayer",   x: 0, y: 0,  w: 1, h: 7  },
  { i: "quran",    x: 0, y: 7,  w: 1, h: 7  },
  { i: "gym",      x: 0, y: 14, w: 1, h: 8  },
  { i: "calendar", x: 1, y: 0,  w: 1, h: 22 },
  { i: "news",     x: 2, y: 0,  w: 2, h: 6  },
  { i: "reading",  x: 2, y: 6,  w: 2, h: 5  },
  { i: "films",    x: 2, y: 11, w: 2, h: 11 },
  { i: "ascii",    x: 3, y: 0,  w: 1, h: 7  },
  { i: "overview", x: 0, y: 22, w: 4, h: 6  },
];

const LAYOUT_KEY = "hayati-layout";
const TEMPLATES_KEY = "hayati-layout-templates";

function readTemplates(): LayoutTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(t => t.id && t.name && Array.isArray(t.layout));
  } catch { return []; }
}

function readLayout(): LayoutItem[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as LayoutItem[];
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    const valid = parsed.every(
      (item) =>
        typeof item.i === "string" &&
        typeof item.x === "number" &&
        typeof item.y === "number" &&
        typeof item.w === "number" &&
        typeof item.h === "number"
    );
    if (!valid) return DEFAULT_LAYOUT;
    // If the stored layout contains removed panels, it's stale — use the fresh default
    if (parsed.some(item => REMOVED_PANELS.has(item.i))) return DEFAULT_LAYOUT;
    // Add any panels from DEFAULT_LAYOUT that are missing from the stored layout
    const missing = DEFAULT_LAYOUT.filter(d => !parsed.find(p => p.i === d.i));
    const merged = [...parsed, ...missing];
    // Force fixed constraints for certain panels regardless of stored value
    const FORCED: Partial<Record<string, Partial<LayoutItem>>> = {
      overview: { w: 4 },
    };
    return merged.map(item => FORCED[item.i] ? { ...item, ...FORCED[item.i] } : item);
  } catch { return DEFAULT_LAYOUT; }
}

type LayoutCtx = {
  layout: LayoutItem[];
  updateLayout: (next: LayoutItem[]) => void;
  resetLayout: () => void;
  templates: LayoutTemplate[];
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
};

const LayoutContext = createContext<LayoutCtx>({
  layout: DEFAULT_LAYOUT, updateLayout: () => {}, resetLayout: () => {},
  templates: [], saveTemplate: () => {}, loadTemplate: () => {}, deleteTemplate: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  useEffect(() => { setLayout(readLayout()); }, []);
  useEffect(() => { setTemplates(readTemplates()); }, []);

  const updateLayout = (next: LayoutItem[]) => {
    setLayout(next);
    const json = JSON.stringify(next);
    try { localStorage.setItem(LAYOUT_KEY, json); } catch {}
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: LAYOUT_KEY, value: json }),
    }).catch(() => {});
  };
  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    try { localStorage.removeItem(LAYOUT_KEY); } catch {}
  };

  const saveTemplate = (name: string) => {
    const t: LayoutTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      layout: [...layout],
      savedAt: Date.now(),
    };
    const next = [...templates, t];
    setTemplates(next);
    const json = JSON.stringify(next);
    try { localStorage.setItem(TEMPLATES_KEY, json); } catch {}
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: TEMPLATES_KEY, value: json }),
    }).catch(() => {});
  };

  const loadTemplate = (id: string) => {
    const t = templates.find(t => t.id === id);
    if (t) updateLayout(t.layout);
  };

  const deleteTemplate = (id: string) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    const json = JSON.stringify(next);
    try { localStorage.setItem(TEMPLATES_KEY, json); } catch {}
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: TEMPLATES_KEY, value: json }),
    }).catch(() => {});
  };

  return (
    <LayoutContext.Provider value={{ layout, updateLayout, resetLayout, templates, saveTemplate, loadTemplate, deleteTemplate }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() { return useContext(LayoutContext); }
