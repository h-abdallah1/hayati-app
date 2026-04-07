"use client";
import { useState, useEffect } from "react";
import type { GithubDay } from "@/lib/types";
import { useGlobalSettings } from "@/lib/settings";
import { DEMO_GITHUB, DEMO_GITHUB_TOTAL } from "@/lib/demoData";

export function useGithub(username: string, token: string, year?: number) {
  const { global: { demoMode } } = useGlobalSettings();
  const [days, setDays] = useState<GithubDay[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const y = year ?? new Date().getFullYear();

  useEffect(() => {
    if (demoMode) { setDays(DEMO_GITHUB); setTotal(DEMO_GITHUB_TOTAL); setLoaded(true); return; }
    if (!username) {
      setDays([]);
      setTotal(0);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetch("/api/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, token, year: y }),
    })
      .then(r => r.json())
      .then(d => {
        setDays(d.days ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [username, token, y, demoMode]);

  return { days, total, loaded };
}
