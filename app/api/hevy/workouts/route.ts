import { NextResponse } from "next/server";

const BASE = "https://api.hevyapp.com/v1";
const KEY  = process.env.HEVY_API_KEY ?? "";

export interface HevySet {
  index: number;
  type: string;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  sets: HevySet[];
}

export interface HevyWorkoutFull {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  duration: number;      // minutes
  exercises: HevyExercise[];
}

interface RawWorkout {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  exercises: { index: number; title: string; sets: HevySet[] }[];
}

interface RawPage {
  page: number;
  page_count: number;
  workouts: RawWorkout[];
}

export async function GET(req: Request) {
  if (!KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const year   = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const cutoff = `${year}-01-01`;
  const end    = `${year + 1}-01-01`;
  const all: HevyWorkoutFull[] = [];

  try {
    let page = 1, pageCount = 1;
    while (page <= pageCount) {
      const res = await fetch(`${BASE}/workouts?page=${page}&pageSize=10`, {
        headers: { "api-key": KEY },
        next: { revalidate: 180 },
      });
      if (!res.ok) break;

      const data: RawPage = await res.json();
      pageCount = data.page_count;

      let done = false;
      for (const w of data.workouts) {
        const date = w.start_time.split("T")[0];
        if (date < cutoff) { done = true; break; }
        if (date >= end) continue; // skip future years
        const duration = Math.round(
          (new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 60000
        );
        all.push({ id: w.id, title: w.title, date, duration, exercises: w.exercises });
      }
      if (done) break;
      page++;
    }
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  return NextResponse.json({ workouts: all });
}
