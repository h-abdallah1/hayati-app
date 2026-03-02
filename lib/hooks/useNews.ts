"use client";

import { useState, useEffect } from "react";
import type { NewsItem, NewsFeed } from "@/lib/types";

export function useNews(feeds: NewsFeed[]) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rev, setRev] = useState(0);
  const feedsKey = feeds.map(f => `${f.url}|${f.label}`).join(",");

  useEffect(() => {
    if (feeds.length === 0) { setLoaded(true); return; }
    setLoaded(false);
    const controller = new AbortController();
    fetch("/api/news", {
      method: "POST",
      body: JSON.stringify({ feeds }),
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    })
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoaded(true); })
      .catch(e => { if (e.name !== "AbortError") setLoaded(true); });
    return () => controller.abort();
  }, [feedsKey, rev]); // eslint-disable-line react-hooks/exhaustive-deps

  return { items, loaded, refresh: () => { setLoaded(false); setRev(r => r + 1); } };
}
