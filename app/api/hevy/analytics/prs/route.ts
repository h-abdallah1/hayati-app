import { NextResponse } from "next/server";
import { fetchHevyWorkouts } from "../../_shared";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const workouts = await fetchHevyWorkouts(year);

  const map = new Map<string, { weight: number; reps: number; date: string }>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.weight_kg || !s.reps) continue;
        const prev = map.get(ex.title);
        if (!prev || s.weight_kg > prev.weight || (s.weight_kg === prev.weight && s.reps > prev.reps)) {
          map.set(ex.title, { weight: s.weight_kg, reps: s.reps, date: w.date });
        }
      }
    }
  }

  const prs = [...map.entries()]
    .map(([title, { weight, reps, date }]) => ({
      title, weight, reps, date,
      orm: Math.round(weight * (1 + reps / 30)),
    }))
    .sort((a, b) => b.weight - a.weight);

  return NextResponse.json({ prs });
}
