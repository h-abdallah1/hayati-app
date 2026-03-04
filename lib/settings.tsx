"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { GlobalSettings, PanelSettings, NewsFeed, TimeFormat, MapProjection, PrayerMethod } from "./types";

// ── Global settings ──────────────────────────────────────────────────────────

const PRAYER_METHODS: PrayerMethod[] = ["Dubai","MuslimWorldLeague","NorthAmerica","Egyptian","Karachi","Kuwait","Qatar","Singapore","Turkey","MoonsightingCommittee"];

const DEFAULT_GLOBAL: GlobalSettings = {
  name: "Hussein",
  location: { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai", label: "Sharjah, UAE" },
  timeFormat: "12h",
  letterboxdUsername: "",
  obsidianVaultPath: "",
  travelProjection: "equirectangular",
  prayerMethod: "Dubai",
};

const GLOBAL_KEY = "hayati-global";

function readGlobal(): GlobalSettings {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    if (!raw) return DEFAULT_GLOBAL;
    const parsed = JSON.parse(raw) as Partial<GlobalSettings>;
    return {
      name: parsed.name ?? DEFAULT_GLOBAL.name,
      location: { ...DEFAULT_GLOBAL.location, ...parsed.location },
      timeFormat: (parsed.timeFormat === "12h" || parsed.timeFormat === "24h") ? parsed.timeFormat as TimeFormat : DEFAULT_GLOBAL.timeFormat,
      letterboxdUsername: typeof parsed.letterboxdUsername === "string" ? parsed.letterboxdUsername : DEFAULT_GLOBAL.letterboxdUsername,
      obsidianVaultPath: typeof parsed.obsidianVaultPath === "string" ? parsed.obsidianVaultPath : DEFAULT_GLOBAL.obsidianVaultPath,
      travelProjection: (["equirectangular","naturalEarth","mercator","robinson","winkel3","mollweide","patterson"] as MapProjection[]).includes(parsed.travelProjection as MapProjection) ? parsed.travelProjection as MapProjection : DEFAULT_GLOBAL.travelProjection,
      prayerMethod: PRAYER_METHODS.includes(parsed.prayerMethod as PrayerMethod) ? parsed.prayerMethod as PrayerMethod : DEFAULT_GLOBAL.prayerMethod,
    };
  } catch {
    return DEFAULT_GLOBAL;
  }
}

type GlobalCtx = {
  global: GlobalSettings;
  updateGlobal: (partial: Partial<GlobalSettings>) => void;
};

const GlobalContext = createContext<GlobalCtx>({
  global: DEFAULT_GLOBAL,
  updateGlobal: () => {},
});

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const [global, setGlobal] = useState<GlobalSettings>(DEFAULT_GLOBAL);

  useEffect(() => {
    setGlobal(readGlobal());
  }, []);

  const updateGlobal = (partial: Partial<GlobalSettings>) => {
    setGlobal(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <GlobalContext.Provider value={{ global, updateGlobal }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalSettings() {
  return useContext(GlobalContext);
}

// ── Panel settings ────────────────────────────────────────────────────────────

const DEFAULT_PANELS: PanelSettings = {
  newsFeeds: [],
  calendarFeeds: [],
  hiddenPanels: [],
  pomodoroWork: 25,
  pomodoroBreak: 5,
};

const PANELS_KEY = "hayati-panels";

function readPanels(): PanelSettings {
  try {
    const raw = localStorage.getItem(PANELS_KEY);
    if (!raw) return DEFAULT_PANELS;
    const parsed = JSON.parse(raw) as Partial<PanelSettings>;
    return {
      newsFeeds: Array.isArray(parsed.newsFeeds)
        ? parsed.newsFeeds.map((f: unknown): NewsFeed =>
            typeof f === "string" ? { url: f, label: "" } : (f as NewsFeed)
          )
        : DEFAULT_PANELS.newsFeeds,
      calendarFeeds: Array.isArray(parsed.calendarFeeds) ? parsed.calendarFeeds : DEFAULT_PANELS.calendarFeeds,
      hiddenPanels: Array.isArray(parsed.hiddenPanels) ? parsed.hiddenPanels : DEFAULT_PANELS.hiddenPanels,
      pomodoroWork: typeof parsed.pomodoroWork === "number" ? parsed.pomodoroWork : DEFAULT_PANELS.pomodoroWork,
      pomodoroBreak: typeof parsed.pomodoroBreak === "number" ? parsed.pomodoroBreak : DEFAULT_PANELS.pomodoroBreak,
    };
  } catch {
    return DEFAULT_PANELS;
  }
}

type PanelsCtx = {
  panels: PanelSettings;
  updatePanels: (partial: Partial<PanelSettings>) => void;
};

const PanelsContext = createContext<PanelsCtx>({
  panels: DEFAULT_PANELS,
  updatePanels: () => {},
});

export function PanelSettingsProvider({ children }: { children: React.ReactNode }) {
  const [panels, setPanels] = useState<PanelSettings>(DEFAULT_PANELS);

  useEffect(() => {
    setPanels(readPanels());
  }, []);

  const updatePanels = (partial: Partial<PanelSettings>) => {
    setPanels(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(PANELS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <PanelsContext.Provider value={{ panels, updatePanels }}>
      {children}
    </PanelsContext.Provider>
  );
}

export function usePanelSettings() {
  return useContext(PanelsContext);
}
