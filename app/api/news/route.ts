import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "@/lib/types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function parseDate(raw: unknown): number {
  if (!raw) return 0;
  const d = new Date(String(raw));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatAge(ts: number): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function sourceFromUrl(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

type RawEntry = Record<string, unknown>;

async function parseFeed(url: string, label: string): Promise<Array<NewsItem & { ts: number }>> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } });
  const text = await res.text();
  const data = parser.parse(text);

  const items: Array<NewsItem & { ts: number }> = [];
  const source = label.trim() || sourceFromUrl(url);

  // RSS 2.0
  const rssItems = data?.rss?.channel?.item;
  if (rssItems) {
    const arr: RawEntry[] = Array.isArray(rssItems) ? rssItems : [rssItems];
    for (const it of arr) {
      const title = String(it.title ?? "").replace(/<[^>]+>/g, "").trim();
      const link = String(it.link ?? it.guid ?? "");
      const ts = parseDate(it.pubDate);
      if (title) items.push({ source, title, url: link, time: "", ts });
    }
    return items;
  }

  // Atom
  const atomEntries = data?.feed?.entry;
  if (atomEntries) {
    const arr: RawEntry[] = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    for (const en of arr) {
      const rawTitle = en.title;
      const title = String(
        typeof rawTitle === "object" && rawTitle !== null
          ? (rawTitle as RawEntry)["#text"] ?? ""
          : rawTitle ?? ""
      ).replace(/<[^>]+>/g, "").trim();

      const rawLinks = en.link ? (Array.isArray(en.link) ? en.link : [en.link]) : [];
      const link = (rawLinks as RawEntry[]).find(l => l["@_rel"] !== "self")?.["@_href"]
        ?? (rawLinks as RawEntry[])[0]?.["@_href"]
        ?? "";

      const ts = parseDate(en.published ?? en.updated);
      if (title) items.push({ source, title, url: String(link), time: "", ts });
    }
    return items;
  }

  return items;
}

export async function POST(req: NextRequest) {
  try {
    const { feeds } = (await req.json()) as { feeds: Array<{ url: string; label: string }> };
    if (!Array.isArray(feeds) || feeds.length === 0) return NextResponse.json({ items: [] });

    const results = await Promise.allSettled(feeds.map(f => parseFeed(f.url, f.label)));
    const all: Array<NewsItem & { ts: number }> = [];
    for (const r of results) {
      if (r.status === "fulfilled") all.push(...r.value);
    }

    all.sort((a, b) => b.ts - a.ts);

    const items: NewsItem[] = all.slice(0, 20).map(({ ts, ...rest }) => ({
      ...rest,
      time: formatAge(ts),
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
