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

    fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/editions/quran-uthmani,en.asad`)
      .then(r => r.json())
      .then(data => {
        const ar = data.data[0];
        const en = data.data[1];
        setVerse({
          arabic: ar.text,
          translation: en.text,
          ref: `${ar.surah.englishName} ${ar.surah.number}:${ar.numberInSurah}`,
          url: `https://quran.com/${ar.surah.number}/${ar.numberInSurah}`,
        });
      })
      .catch(() => {});
  }, []);

  return verse;
}
