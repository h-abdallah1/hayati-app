import type { CalEventFull, Goal, FilmEntry, GithubDay } from "@/lib/types";

export interface AiContextData {
  userName: string;
  locationLabel: string;
  currentDate: string;
  currentTime: string;
  prayers: { name: string; time: string; mins: number }[];
  nextPrayer: { name: string } | null;
  weather: {
    temp: string;
    condition: string;
    feelsLike: string;
    humidity: string;
    wind: string;
    loaded: boolean;
  };
  upcomingEvents: CalEventFull[];
  activeGoals: Goal[];
  doneGoalsThisYear: Goal[];
  gymStreak: number;
  gymSessionsThisYear: number;
  gymLoggedToday: boolean;
  lastWorkout: { title: string; date: string; duration: number } | null;
  currentBook: { title: string; author: string; progress: number } | null;
  recentBooks: { title: string; author?: string; finishedDate: string }[];
  recentFilms: Pick<FilmEntry, "title" | "year" | "rating" | "watchedDate">[];
  githubContributionsTotal: number;
  githubStreak: number;
  quranVerse: { translation: string; ref: string } | null;
  visitedCountriesCount: number;
}

export function buildSystemPrompt(data: AiContextData): string {
  const {
    userName, locationLabel, currentDate, currentTime,
    prayers, nextPrayer, weather,
    upcomingEvents, activeGoals, doneGoalsThisYear,
    gymStreak, gymSessionsThisYear, gymLoggedToday, lastWorkout,
    currentBook, recentBooks, recentFilms,
    githubContributionsTotal, githubStreak,
    quranVerse, visitedCountriesCount,
  } = data;

  const lines: string[] = [];
  const dayOfWeek = new Date(currentDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });

  lines.push(`You are ${userName}'s personal assistant. Be concise and direct.`);
  lines.push(`You know his schedule, habits, goals, and daily context.`);
  lines.push(`Respond in 1-3 sentences unless asked for more detail.`);
  lines.push(`Today is ${currentDate} (${dayOfWeek}). Time: ${currentTime}.`);
  lines.push("");

  lines.push("== CURRENT CONTEXT ==");
  lines.push(`Location: ${locationLabel}`);
  lines.push("");

  lines.push("== PRAYER TIMES TODAY ==");
  for (const p of prayers) {
    const marker = nextPrayer?.name === p.name ? " ← next" : "";
    lines.push(`${p.name}: ${p.time}${marker}`);
  }
  lines.push("");

  lines.push("== WEATHER ==");
  if (weather.loaded) {
    lines.push(`Temp: ${weather.temp} (feels ${weather.feelsLike})`);
    lines.push(`Condition: ${weather.condition}`);
    lines.push(`Humidity: ${weather.humidity} | Wind: ${weather.wind}`);
  } else {
    lines.push("Not loaded yet.");
  }
  lines.push("");

  lines.push("== UPCOMING EVENTS (next 7 days) ==");
  if (upcomingEvents.length === 0) {
    lines.push("No upcoming events.");
  } else {
    for (const ev of upcomingEvents) {
      lines.push(`${ev.date}: ${ev.label}`);
    }
  }
  lines.push("");

  lines.push("== ACTIVE GOALS ==");
  if (activeGoals.length === 0) {
    lines.push("No active goals.");
  } else {
    for (const g of activeGoals) {
      lines.push(`- ${g.title}${g.description ? ` (${g.description})` : ""}`);
    }
  }
  lines.push("");

  if (doneGoalsThisYear.length > 0) {
    lines.push("== COMPLETED GOALS (this year) ==");
    for (const g of doneGoalsThisYear) {
      lines.push(`- ${g.title}${g.completedAt ? ` (completed ${g.completedAt})` : ""}`);
    }
    lines.push("");
  }

  lines.push("== GYM ==");
  lines.push(`Streak: ${gymStreak} weeks | Sessions this year: ${gymSessionsThisYear} | Logged today: ${gymLoggedToday ? "Yes" : "No"}`);
  if (lastWorkout) {
    lines.push(`Last workout: ${lastWorkout.title} — ${lastWorkout.duration}min on ${lastWorkout.date}`);
  } else {
    lines.push("Last workout: None logged yet");
  }
  lines.push("");

  if (currentBook) {
    lines.push("== CURRENTLY READING ==");
    lines.push(`"${currentBook.title}" by ${currentBook.author} — ${currentBook.progress}% done`);
    lines.push("");
  }

  if (recentBooks.length > 0) {
    lines.push("== RECENTLY FINISHED BOOKS ==");
    for (const b of recentBooks) {
      lines.push(`- ${b.title}${b.author ? ` by ${b.author}` : ""} (${b.finishedDate})`);
    }
    lines.push("");
  }

  if (recentFilms.length > 0) {
    lines.push("== RECENT FILMS (Letterboxd) ==");
    for (const f of recentFilms) {
      const rating = f.rating != null ? ` ★${f.rating}` : "";
      const year = f.year ? ` (${f.year})` : "";
      lines.push(`- ${f.title}${year}${rating}`);
    }
    lines.push("");
  }

  if (githubContributionsTotal > 0 || githubStreak > 0) {
    lines.push("== GITHUB (this year) ==");
    lines.push(`Total contributions: ${githubContributionsTotal} | Current streak: ${githubStreak} days`);
    lines.push("");
  }

  if (visitedCountriesCount > 0) {
    lines.push("== TRAVEL ==");
    lines.push(`Countries visited: ${visitedCountriesCount}`);
    lines.push("");
  }

  if (quranVerse) {
    lines.push("== QURAN (today) ==");
    lines.push(`"${quranVerse.translation}" — ${quranVerse.ref}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
