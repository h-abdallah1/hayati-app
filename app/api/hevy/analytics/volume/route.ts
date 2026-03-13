import { NextResponse } from "next/server";
import { fetchHevyWorkouts } from "../../_shared";
import { weekStart, workoutVolume } from "@/app/gym/helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const workouts = await fetchHevyWorkouts(year);

  const map = new Map<string, number>();
  for (const w of workouts) {
    const wk = weekStart(w.date);
    map.set(wk, (map.get(wk) ?? 0) + workoutVolume(w));
  }

  const byWeek = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([wk, vol]) => ({
      label: new Date(wk + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      vol: Math.round(vol),
    }));

  const total = Math.round(byWeek.reduce((s, w) => s + w.vol, 0));

  return NextResponse.json({ byWeek, total });
}
