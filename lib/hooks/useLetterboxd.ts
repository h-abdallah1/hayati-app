"use client";

import { useState, useEffect } from "react";
import type { FilmEntry } from "@/lib/types";
import { useGlobalSettings } from "@/lib/settings";
import { DEMO_FILMS } from "@/lib/demoData";

export function useLetterboxd(username: string) {
  const { global: { demoMode } } = useGlobalSettings();
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (demoMode) {
      setFilms(DEMO_FILMS);
      setLoaded(true);
      // Lazily fetch posters from Wikipedia for demo films that have no poster
      DEMO_FILMS.forEach((film, i) => {
        if (film.poster) return;
        fetch(`/api/poster?title=${encodeURIComponent(film.title)}&year=${film.year ?? ""}`)
          .then(r => r.json())
          .then((d: { url: string | null }) => {
            if (d.url) setFilms(prev => prev.map((f, j) => j === i ? { ...f, poster: d.url! } : f));
          })
          .catch(() => {});
      });
      return;
    }
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
  }, [username, rev, demoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { films, loaded, refresh: () => { setLoaded(false); setRev(r => r + 1); } };
}
