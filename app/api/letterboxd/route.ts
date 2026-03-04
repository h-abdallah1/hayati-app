import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import type { FilmEntry } from "@/lib/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  processEntities: true,
});

const UA = "Mozilla/5.0 (compatible; Hayati/1.0; RSS reader)";

type RawEntry = Record<string, unknown>;

function extractText(val: unknown): string {
  if (!val && val !== 0) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    return String(o["__cdata"] ?? o["#text"] ?? "");
  }
  return String(val);
}

function extractPoster(description: unknown): string | undefined {
  const html = extractText(description);
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? undefined;
}

function extractReview(description: unknown): string | undefined {
  const html = extractText(description);
  const noImg = html.replace(/<img[^>]*>/gi, "");
  const text = noImg.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || undefined;
}

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username")?.trim();
    if (!username) return NextResponse.json({ films: [] });

    const url = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return NextResponse.json({ films: [] });

    const text = await res.text();
    let data: Record<string, unknown>;
    try { data = parser.parse(text) as Record<string, unknown>; } catch { return NextResponse.json({ films: [] }); }

    const channel = (data?.rss as RawEntry)?.channel as RawEntry | undefined;
    if (!channel) return NextResponse.json({ films: [] });

    const rawItems = channel.item;
    if (!rawItems) return NextResponse.json({ films: [] });

    const arr: RawEntry[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    const films: FilmEntry[] = [];
    for (const item of arr) {
      const watchedDate = extractText(item["letterboxd:watchedDate"]);
      if (!watchedDate) continue; // skip non-diary entries

      const title = extractText(item["letterboxd:filmTitle"]) || extractText(item.title);
      const yearRaw = item["letterboxd:filmYear"];
      const year = yearRaw ? Number(extractText(yearRaw)) || undefined : undefined;
      const ratingRaw = item["letterboxd:memberRating"];
      const rating = ratingRaw ? Number(extractText(ratingRaw)) || undefined : undefined;
      const rewatch = extractText(item["letterboxd:rewatch"]).toLowerCase() === "yes";
      const liked = extractText(item["letterboxd:memberLike"]).toLowerCase() === "yes";
      const poster = extractPoster(item.description);
      const review = extractReview(item.description);
      const link = extractText(item.link) || undefined;

      films.push({ title, year, rating, watchedDate, rewatch, liked, poster, url: link, review });
    }

    films.sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));

    return NextResponse.json({ films: films.slice(0, 50) });
  } catch {
    return NextResponse.json({ films: [] });
  }
}
