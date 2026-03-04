"use client";

import { useState, useEffect } from "react";
import type { FilmEntry } from "@/lib/types";

export function useLetterboxd(username: string) {
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!username) { setLoaded(true); return; }
    setLoaded(false);
    const controller = new AbortController();
    fetch(`/api/letterboxd?username=${encodeURIComponent(username)}`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(d => { setFilms(d.films ?? []); setLoaded(true); })
      .catch(e => { if (e.name !== "AbortError") setLoaded(true); });
    return () => controller.abort();
  }, [username, rev]); // eslint-disable-line react-hooks/exhaustive-deps

  return { films, loaded, refresh: () => { setLoaded(false); setRev(r => r + 1); } };
}
