"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { AppSettings, NewsFeed } from "./types";

const DEFAULT_SETTINGS: AppSettings = {
  name: "Hussein",
  location: { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai", label: "Sharjah, UAE" },
  newsFeeds: [],
  calendarFeeds: [],
};

const STORAGE_KEY = "hayati-settings";

function readFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      name: parsed.name ?? DEFAULT_SETTINGS.name,
      location: { ...DEFAULT_SETTINGS.location, ...parsed.location },
      newsFeeds: Array.isArray(parsed.newsFeeds)
        ? parsed.newsFeeds.map((f: unknown): NewsFeed =>
            typeof f === "string" ? { url: f, label: "" } : (f as NewsFeed)
          )
        : DEFAULT_SETTINGS.newsFeeds,
      calendarFeeds: Array.isArray(parsed.calendarFeeds) ? parsed.calendarFeeds : DEFAULT_SETTINGS.calendarFeeds,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type SettingsCtx = {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
};

const SettingsContext = createContext<SettingsCtx>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(readFromStorage());
  }, []);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
