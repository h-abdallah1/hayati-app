import { NextResponse } from "next/server";
import { fetchHevyWorkouts } from "../../_shared";
import { SPLIT_CAT } from "@/app/gym/helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const workouts = await fetchHevyWorkouts(year);

  // Top 5 exercises by frequency (chronological weight history)
  const exMap = new Map<string, { count: number; history: { weight: number }[] }>();
  for (const w of [...workouts].reverse()) {
    for (const ex of w.exercises) {
      const p   = exMap.get(ex.title) ?? { count: 0, history: [] };
      const max = Math.max(0, ...ex.sets.map(s => s.weight_kg ?? 0));
      exMap.set(ex.title, {
        count:   p.count + 1,
        history: max > 0 ? [...p.history, { weight: max }] : p.history,
      });
    }
  }
  const topExercises = [...exMap.entries()]
    .map(([title, s]) => ({ title, ...s }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Split distribution (top 5 categories)
  const splitMap = new Map<string, number>();
  for (const w of workouts) {
    const cat = SPLIT_CAT(w.title);
    splitMap.set(cat, (splitMap.get(cat) ?? 0) + 1);
  }
  const splitRows = [...splitMap.entries()]
    .map(([cat, n]) => ({ cat, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  // 4 most recent workouts
  const recent = workouts.slice(0, 4).map(w => ({
    id: w.id, title: w.title, date: w.date, duration: w.duration,
  }));

  // All trained dates (for "this week" grid)
  const trainedDates = workouts.map(w => w.date);

  return NextResponse.json({ topExercises, splitRows, recent, trainedDates });
}
