"use client";

import { useState, useEffect } from "react";
import type { CalEventFull } from "@/lib/types";
import { useGlobalSettings } from "@/lib/settings";
import { DEMO_CALENDAR } from "@/lib/demoData";

export function useCalendarEvents(feeds: string[]) {
  const { global: { demoMode } } = useGlobalSettings();
  const [events, setEvents] = useState<CalEventFull[]>([]);
  const [loaded, setLoaded] = useState(false);
  const feedsKey = feeds.join("|");

  useEffect(() => {
    if (demoMode) { setEvents(DEMO_CALENDAR); setLoaded(true); return; }
    if (feeds.length === 0) { setLoaded(true); return; }
    const controller = new AbortController();
    fetch("/api/calendar", {
      method: "POST",
      body: JSON.stringify({ feeds }),
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(d => { setEvents(d.events ?? []); setLoaded(true); })
      .catch(e => { if (e.name !== "AbortError") setLoaded(true); });
    return () => controller.abort();
  }, [feedsKey, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { events, loaded };
}
