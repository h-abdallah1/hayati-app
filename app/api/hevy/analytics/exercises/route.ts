import { NextResponse } from "next/server";
import { fetchHevyWorkouts } from "../../_shared";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const workouts = await fetchHevyWorkouts(year);

  const map = new Map<string, {
    count: number; sets: number; reps: number; maxWeight: number;
    history: { weight: number }[];
  }>();

  for (const w of [...workouts].reverse()) {
    for (const ex of w.exercises) {
      const p          = map.get(ex.title) ?? { count: 0, sets: 0, reps: 0, maxWeight: 0, history: [] };
      const sessionMax = Math.max(0, ...ex.sets.map(s => s.weight_kg ?? 0));
      map.set(ex.title, {
        count:     p.count + 1,
        sets:      p.sets + ex.sets.length,
        reps:      p.reps + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
        maxWeight: Math.max(p.maxWeight, sessionMax),
        history:   sessionMax > 0 ? [...p.history, { weight: sessionMax }] : p.history,
      });
    }
  }

  const exercises = [...map.entries()]
    .map(([title, s]) => ({ title, ...s }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ exercises });
}
