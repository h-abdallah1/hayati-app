import { NextRequest, NextResponse } from "next/server";
import ICAL from "ical.js";
import type { CalEventFull } from "@/lib/types";

const COLORS = ["#4ecdc4", "#c8f135", "#5b9bd5", "#ffb347", "#ff5c5c"];

async function parseFeed(url: string, colorIndex: number): Promise<CalEventFull[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
  const text = await res.text();

  const jcal = ICAL.parse(text);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");

  const now = new Date();
  const minDate = new Date(now);
  minDate.setMonth(minDate.getMonth() - 1);
  const maxDate = new Date(now);
  maxDate.setMonth(maxDate.getMonth() + 3);

  const color = COLORS[colorIndex % COLORS.length];
  const events: CalEventFull[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const startDate = event.startDate?.toJSDate?.();
    if (!startDate || isNaN(startDate.getTime())) continue;
    if (startDate < minDate || startDate > maxDate) continue;

    const label = event.summary ?? "Event";
    const url = vevent.getFirstPropertyValue("url") as string | null;
    const isoDate = startDate.toISOString().slice(0, 10);

    events.push({ date: isoDate, label: String(label), color, ...(url ? { url: String(url) } : {}) });
  }

  return events;
}

export async function POST(req: NextRequest) {
  try {
    const { feeds } = (await req.json()) as { feeds: string[] };
    if (!Array.isArray(feeds) || feeds.length === 0) return NextResponse.json({ events: [] });

    const results = await Promise.allSettled(feeds.map((f, i) => parseFeed(f, i)));
    const all: CalEventFull[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") all.push(...r.value);
    }

    all.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ events: all });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
