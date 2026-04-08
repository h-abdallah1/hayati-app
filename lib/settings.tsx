"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { GlobalSettings, PanelSettings, NewsFeed, TimeFormat, MapProjection, PrayerMethod } from "./types";
import { DEMO_SETTINGS_PATCH } from "./demoData";
import { DEFAULT_COORDS } from "./constants";

// ── Global settings ──────────────────────────────────────────────────────────

const PRAYER_METHODS: PrayerMethod[] = ["Dubai","MuslimWorldLeague","NorthAmerica","Egyptian","Karachi","Kuwait","Qatar","Singapore","Turkey","MoonsightingCommittee"];

const DEFAULT_GLOBAL: GlobalSettings = {
  name: "Your Name",
  location: { ...DEFAULT_COORDS, label: "London, UK" },
  timeFormat: "12h",
  letterboxdUsername: "",
  obsidianVaultPath: "",
  travelProjection: "equirectangular",
  prayerMethod: "MuslimWorldLeague",
  disabledModules: [],
  moduleOrder: [],
  showTicker: true,
  githubUsername: "",
  githubToken: "",
  fullscreen: false,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.2:1b",
  accentTheme: "sage",
  bgStyle: "orbs",
  demoMode: false,
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
      disabledModules: Array.isArray(parsed.disabledModules) ? parsed.disabledModules : DEFAULT_GLOBAL.disabledModules,
      moduleOrder: Array.isArray(parsed.moduleOrder) ? parsed.moduleOrder : DEFAULT_GLOBAL.moduleOrder,
      showTicker: typeof parsed.showTicker === "boolean" ? parsed.showTicker : DEFAULT_GLOBAL.showTicker,
      githubUsername: typeof parsed.githubUsername === "string" ? parsed.githubUsername : DEFAULT_GLOBAL.githubUsername,
      githubToken: typeof parsed.githubToken === "string" ? parsed.githubToken : DEFAULT_GLOBAL.githubToken,
      fullscreen: typeof parsed.fullscreen === "boolean" ? parsed.fullscreen : DEFAULT_GLOBAL.fullscreen,
      ollamaUrl:    typeof parsed.ollamaUrl === "string"    ? parsed.ollamaUrl    : DEFAULT_GLOBAL.ollamaUrl,
      ollamaModel:  typeof parsed.ollamaModel === "string"  ? parsed.ollamaModel  : DEFAULT_GLOBAL.ollamaModel,
      accentTheme:  typeof parsed.accentTheme === "string"  ? parsed.accentTheme  : DEFAULT_GLOBAL.accentTheme,
      bgStyle: (["orbs", "ps3", "night", "stars", "rain", "matrix", "fireflies", "particles", "gradient"] as const).includes(parsed.bgStyle as GlobalSettings["bgStyle"]) ? parsed.bgStyle as GlobalSettings["bgStyle"] : DEFAULT_GLOBAL.bgStyle,
      demoMode: typeof parsed.demoMode === "boolean" ? parsed.demoMode : DEFAULT_GLOBAL.demoMode,
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

  const updateGlobal = useCallback((partial: Partial<GlobalSettings>) => {
    setGlobal(prev => {
      const next = { ...prev, ...partial };
      const json = JSON.stringify(next);
      try { localStorage.setItem(GLOBAL_KEY, json); } catch {}
      fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: GLOBAL_KEY, value: json }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ global, updateGlobal }), [global, updateGlobal]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalSettings() {
  const ctx = useContext(GlobalContext);
  if (ctx.global.demoMode) {
    return { ...ctx, global: { ...ctx.global, ...DEMO_SETTINGS_PATCH } };
  }
  return ctx;
}

// ── Panel settings ────────────────────────────────────────────────────────────

const DEFAULT_PANELS: PanelSettings = {
  newsFeeds: [],
  calendarFeeds: [],
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

  const updatePanels = useCallback((partial: Partial<PanelSettings>) => {
    setPanels(prev => {
      const next = { ...prev, ...partial };
      const json = JSON.stringify(next);
      try { localStorage.setItem(PANELS_KEY, json); } catch {}
      fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: PANELS_KEY, value: json }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ panels, updatePanels }), [panels, updatePanels]);

  return (
    <PanelsContext.Provider value={value}>
      {children}
    </PanelsContext.Provider>
  );
}

export function usePanelSettings() {
  return useContext(PanelsContext);
}
