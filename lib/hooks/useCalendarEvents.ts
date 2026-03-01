"use client";

import { useState, useEffect } from "react";
import type { CalEventFull } from "@/lib/types";

export function useCalendarEvents(feeds: string[]) {
  const [events, setEvents] = useState<CalEventFull[]>([]);
  const [loaded, setLoaded] = useState(false);
  const feedsKey = feeds.join("|");

  useEffect(() => {
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
  }, [feedsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { events, loaded };
}
