import { NextResponse } from "next/server";

const BASE = "https://api.hevyapp.com/v1";
const KEY  = process.env.HEVY_API_KEY ?? "";

interface HevyWorkout {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface HevyResponse {
  page: number;
  page_count: number;
  workouts: HevyWorkout[];
}

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay() || 7; // Mon=1 ... Sun=7
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function calcWeekStreak(dates: string[]): number {
  const weeks = new Set(dates.map(getISOWeek));
  const todayWeek = getISOWeek(new Date().toISOString().split("T")[0]);
  let streak = 0;
  const d = new Date();
  let currentWeek = todayWeek;
  // If current week has no workout yet, start checking from last week
  if (!weeks.has(currentWeek)) {
    d.setDate(d.getDate() - 7);
    currentWeek = getISOWeek(d.toISOString().split("T")[0]);
  }
  while (weeks.has(currentWeek)) {
    streak++;
    d.setDate(d.getDate() - 7);
    currentWeek = getISOWeek(d.toISOString().split("T")[0]);
  }
  return streak;
}

export async function GET() {
  if (!KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const year  = new Date().getFullYear();
  const cutoff = `${year}-01-01`;

  const dates: string[]      = [];
  let lastWorkout: { title: string; date: string; duration: number } | null = null;

  try {
    let page = 1;
    let pageCount = 1;

    while (page <= pageCount) {
      const res  = await fetch(`${BASE}/workouts?page=${page}&pageSize=10`, {
        headers: { "api-key": KEY },
        next: { revalidate: 300 }, // cache 5 min
      });
      if (!res.ok) break;

      const data: HevyResponse = await res.json();
      pageCount = data.page_count;

      let hitPrevYear = false;
      for (const w of data.workouts) {
        const date = w.start_time.split("T")[0];
        if (date < cutoff) { hitPrevYear = true; break; }
        dates.push(date);
        if (!lastWorkout) {
          const start    = new Date(w.start_time).getTime();
          const end      = new Date(w.end_time).getTime();
          const duration = Math.round((end - start) / 60000); // minutes
          lastWorkout = { title: w.title, date, duration };
        }
      }

      if (hitPrevYear) break;
      page++;
    }
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const today  = new Date().toISOString().split("T")[0];
  const uniqueDates = [...new Set(dates)]; // dedupe for day-level display

  // Build past-7-days array (today + 6 days back)
  const week: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const tmp = new Date(d);
    tmp.setDate(d.getDate() - i);
    week.push(tmp.toISOString().split("T")[0]);
  }

  return NextResponse.json({
    count:       dates.length,            // total sessions (not deduplicated)
    streak:      calcWeekStreak(dates),   // consecutive weeks with at least 1 session
    loggedToday: uniqueDates.includes(today),
    lastWorkout,
    week,
    workoutDates: uniqueDates,            // unique dates for the 7-day dot display
  });
}
