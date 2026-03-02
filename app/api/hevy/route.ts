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

function calcStreak(dates: string[]): number {
  const set  = new Set(dates);
  const today = new Date().toISOString().split("T")[0];
  let streak  = 0;
  const d     = new Date();
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  while (true) {
    const s = d.toISOString().split("T")[0];
    if (!set.has(s)) break;
    streak++;
    d.setDate(d.getDate() - 1);
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
  const unique = [...new Set(dates)]; // dedupe same-day sessions

  // Build past-7-days array (today + 6 days back)
  const week: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const tmp = new Date(d);
    tmp.setDate(d.getDate() - i);
    week.push(tmp.toISOString().split("T")[0]);
  }

  return NextResponse.json({
    count:       unique.length,
    streak:      calcStreak(unique),
    loggedToday: unique.includes(today),
    lastWorkout,
    week,                          // ["2026-02-24", ..., "2026-03-02"]
    workoutDates: unique,          // all 2026 dates for client-side lookup
  });
}
