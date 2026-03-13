"use client";

import { useState, useEffect } from "react";

interface QuranVerse {
  arabic: string;
  translation: string;
  ref: string;
  url: string;
}

export function useQuranVerse() {
  const [verse, setVerse] = useState<QuranVerse | null>(null);

  useEffect(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const ayahNum = ((dayOfYear - 1) % 6236) + 1;

    fetch(`/api/quran?ayah=${ayahNum}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setVerse(data); })
      .catch(() => {});
  }, []);

  return verse;
}
