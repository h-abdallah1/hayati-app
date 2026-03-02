import { NextResponse } from "next/server";

const BASE = "https://api.hevyapp.com/v1";
const KEY  = process.env.HEVY_API_KEY ?? "";

interface RawWorkout {
  start_time: string;
  end_time: string;
}
interface RawPage {
  page_count: number;
  workouts: RawWorkout[];
}

function mondayOf(dateStr: string): string {
  const d   = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().split("T")[0];
}

function calcLongestWeeklyStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const weeks = [...new Set(dates.map(mondayOf))].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < weeks.length; i++) {
    const diff = (new Date(weeks[i]).getTime() - new Date(weeks[i - 1]).getTime()) / 86400000;
    if (diff === 7) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

export async function GET() {
  if (!KEY) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const allDates: string[] = [];
  let totalMins = 0;

  try {
    // First call to get page count
    const first = await fetch(`${BASE}/workouts?page=1&pageSize=10`, {
      headers: { "api-key": KEY },
      next: { revalidate: 3600 },
    });
    if (!first.ok) throw new Error();
    const firstData: RawPage = await first.json();
    const pageCount = firstData.page_count;

    const processPage = (data: RawPage) => {
      for (const w of data.workouts) {
        allDates.push(w.start_time.split("T")[0]);
        totalMins += Math.round(
          (new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 60000
        );
      }
    };

    processPage(firstData);

    // Fetch remaining pages in parallel (batches of 5 to avoid hammering)
    for (let batch = 0; batch < Math.ceil((pageCount - 1) / 5); batch++) {
      const start = batch * 5 + 2;
      const end   = Math.min(start + 4, pageCount);
      const pages = await Promise.all(
        Array.from({ length: end - start + 1 }, (_, i) =>
          fetch(`${BASE}/workouts?page=${start + i}&pageSize=10`, {
            headers: { "api-key": KEY },
            next: { revalidate: 3600 },
          }).then(r => r.json() as Promise<RawPage>)
        )
      );
      pages.forEach(processPage);
    }
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const totalHrs     = Math.round(totalMins / 60);
  const longestStreak = calcLongestWeeklyStreak(allDates);
  const firstDate    = [...allDates].sort()[0] ?? null;
  const totalSessions = new Set(allDates).size; // unique days (but count all sessions)

  return NextResponse.json({
    totalSessions: allDates.length,
    totalHrs,
    longestStreak,
    firstDate,
  });
}
