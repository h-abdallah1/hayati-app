import type { CalEventFull, Goal } from "@/lib/types";

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
  gymStreak: number;
  gymSessionsThisYear: number;
  gymLoggedToday: boolean;
}

export function buildSystemPrompt(data: AiContextData): string {
  const {
    userName, locationLabel, currentDate, currentTime,
    prayers, nextPrayer, weather,
    upcomingEvents, activeGoals,
    gymStreak, gymSessionsThisYear, gymLoggedToday,
  } = data;

  const lines: string[] = [];

  lines.push(`You are a personal assistant for ${userName}. Be concise, direct, and helpful.`);
  lines.push("");

  lines.push("== CURRENT CONTEXT ==");
  lines.push(`User: ${userName}`);
  lines.push(`Location: ${locationLabel}`);
  lines.push(`Date: ${currentDate}`);
  lines.push(`Time: ${currentTime}`);
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

  lines.push("== GYM ==");
  lines.push(`Streak: ${gymStreak} days`);
  lines.push(`Sessions this year: ${gymSessionsThisYear}`);
  lines.push(`Logged today: ${gymLoggedToday ? "Yes" : "No"}`);

  return lines.join("\n");
}
