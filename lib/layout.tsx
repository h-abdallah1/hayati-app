"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import type { LayoutItem } from "react-grid-layout";

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "prayer",   x: 0, y: 0,  w: 1, h: 7  },
  { i: "quran",    x: 0, y: 7,  w: 1, h: 7  },
  { i: "gym",      x: 0, y: 14, w: 1, h: 8  },
  { i: "calendar", x: 1, y: 0,  w: 1, h: 9  },
  { i: "finance",  x: 1, y: 9,  w: 1, h: 4  },
  { i: "savings",  x: 1, y: 13, w: 1, h: 4  },
  { i: "news",     x: 2, y: 0,  w: 2, h: 6  },
  { i: "reading",  x: 2, y: 6,  w: 2, h: 5  },
  { i: "films",    x: 2, y: 11, w: 2, h: 5  },
  { i: "overview", x: 0, y: 22, w: 4, h: 6  },
];

const LAYOUT_KEY = "hayati-layout";

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
    // Add any panels from DEFAULT_LAYOUT that are missing from the stored layout
    const missing = DEFAULT_LAYOUT.filter(d => !parsed.find(p => p.i === d.i));
    return [...parsed, ...missing];
  } catch { return DEFAULT_LAYOUT; }
}

type LayoutCtx = {
  layout: LayoutItem[];
  updateLayout: (next: LayoutItem[]) => void;
  resetLayout: () => void;
};

const LayoutContext = createContext<LayoutCtx>({
  layout: DEFAULT_LAYOUT, updateLayout: () => {}, resetLayout: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  useEffect(() => { setLayout(readLayout()); }, []);

  const updateLayout = (next: LayoutItem[]) => {
    setLayout(next);
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(next)); } catch {}
  };
  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    try { localStorage.removeItem(LAYOUT_KEY); } catch {}
  };

  return (
    <LayoutContext.Provider value={{ layout, updateLayout, resetLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() { return useContext(LayoutContext); }
