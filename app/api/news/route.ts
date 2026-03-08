import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "@/lib/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  processEntities: true,
});

const UA = "Mozilla/5.0 (compatible; Hayati/1.0; RSS reader)";

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

import { extractText } from "@/lib/xml";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

type RawEntry = Record<string, unknown>;

function extractLink(entry: RawEntry): string {
  const raw = entry.link;
  if (raw) {
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) {
      const links = raw as RawEntry[];
      const alt = links.find(l => !l["@_rel"] || l["@_rel"] === "alternate");
      return String(alt?.["@_href"] ?? links[0]?.["@_href"] ?? "");
    }
    if (typeof raw === "object" && raw !== null) {
      const l = raw as RawEntry;
      return String(l["@_href"] ?? l["__cdata"] ?? l["#text"] ?? "");
    }
  }
  const guid = entry.guid;
  if (guid) {
    if (typeof guid === "string") return guid;
    if (typeof guid === "object" && guid !== null) {
      const g = guid as RawEntry;
      if (g["@_isPermaLink"] !== "false") return String(g["__cdata"] ?? g["#text"] ?? "");
    }
  }
  return "";
}

function extractDescription(entry: RawEntry): string | undefined {
  const raw = entry["content:encoded"] ?? entry.description ?? entry.summary ?? entry.content ?? "";
  const text = stripHtml(extractText(raw));
  if (!text) return undefined;
  return text.length > 240 ? text.slice(0, 240).replace(/\s+\S*$/, "") + "…" : text;
}

function extractAuthor(entry: RawEntry): string | undefined {
  const dc = entry["dc:creator"];
  if (dc) { const t = extractText(dc).trim(); if (t) return t; }
  const raw = entry.author;
  if (!raw) return undefined;
  if (typeof raw === "string") return raw.trim() || undefined;
  if (typeof raw === "object" && raw !== null) {
    const a = raw as RawEntry;
    const t = String(a.name ?? a["__cdata"] ?? a["#text"] ?? "").trim();
    return t || undefined;
  }
  return undefined;
}

function extractCategories(entry: RawEntry): string[] | undefined {
  const raw = entry.category ?? entry["dc:subject"];
  if (!raw) return undefined;
  const arr = Array.isArray(raw) ? raw : [raw];
  const cats = arr.flatMap((c: unknown): string[] => {
    if (typeof c === "string") return c.trim() ? [c.trim()] : [];
    if (typeof c === "object" && c !== null) {
      const o = c as Record<string, unknown>;
      const v = String(o["@_term"] ?? o["@_label"] ?? o["__cdata"] ?? o["#text"] ?? "").trim();
      return v ? [v] : [];
    }
    return [];
  });
  return cats.length > 0 ? cats.slice(0, 6) : undefined;
}

function extractImage(entry: RawEntry): string | undefined {
  // media:thumbnail
  const thumb = entry["media:thumbnail"];
  if (thumb) {
    const t = Array.isArray(thumb) ? (thumb as RawEntry[])[0] : (thumb as RawEntry);
    if (t?.["@_url"]) return String(t["@_url"]);
  }
  // media:content
  const mc = entry["media:content"];
  if (mc) {
    for (const m of (Array.isArray(mc) ? mc : [mc]) as RawEntry[]) {
      const type = String(m["@_type"] ?? "");
      if (m["@_url"] && (m["@_medium"] === "image" || type.startsWith("image/") || (!m["@_medium"] && !type))) {
        return String(m["@_url"]);
      }
    }
  }
  // enclosure
  const enc = entry.enclosure;
  if (enc && typeof enc === "object") {
    const e = enc as RawEntry;
    if (String(e["@_type"] ?? "").startsWith("image/") && e["@_url"]) return String(e["@_url"]);
  }
  // first <img> in HTML body
  const html = extractText(entry["content:encoded"] ?? entry.description ?? entry.summary ?? "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? undefined;
}

function buildItem(entry: RawEntry, source: string, link: string, ts: number): NewsItem & { ts: number } {
  return {
    source,
    title: extractText(entry.title).replace(/<[^>]+>/g, "").trim(),
    url: link,
    time: "",
    ts,
    description: extractDescription(entry),
    author: extractAuthor(entry),
    categories: extractCategories(entry),
    image: extractImage(entry),
  };
}

async function parseFeed(url: string, label: string): Promise<Array<NewsItem & { ts: number }>> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return [];

  const text = await res.text();
  let data: Record<string, unknown>;
  try { data = parser.parse(text) as Record<string, unknown>; } catch { return []; }

  const items: Array<NewsItem & { ts: number }> = [];
  const source = label.trim() || sourceFromUrl(url);

  // ── RSS 2.0 ────────────────────────────────────────────────────────────────
  const rssItems = (data?.rss as RawEntry)?.channel
    ? (((data.rss as RawEntry).channel as RawEntry).item)
    : undefined;
  if (rssItems) {
    const arr: RawEntry[] = Array.isArray(rssItems) ? rssItems : [rssItems];
    for (const it of arr) {
      const item = buildItem(it, source, extractLink(it), parseDate(it.pubDate ?? it["dc:date"]));
      if (item.title) items.push(item);
    }
    return items;
  }

  // ── Atom ───────────────────────────────────────────────────────────────────
  const atomEntries = (data?.feed as RawEntry)?.entry;
  if (atomEntries) {
    const arr: RawEntry[] = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    for (const en of arr) {
      const item = buildItem(en, source, extractLink(en), parseDate(en.published ?? en.updated ?? en["dc:date"]));
      if (item.title) items.push(item);
    }
    return items;
  }

  // ── RSS 1.0 / RDF ──────────────────────────────────────────────────────────
  const rdfItems = (data?.["rdf:RDF"] as RawEntry)?.item;
  if (rdfItems) {
    const arr: RawEntry[] = Array.isArray(rdfItems) ? rdfItems : [rdfItems];
    for (const it of arr) {
      const link = String(it.link ?? (it as RawEntry)["@_rdf:about"] ?? "");
      const item = buildItem(it, source, link, parseDate(it["dc:date"] ?? it.pubDate));
      if (item.title) items.push(item);
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

    const items: NewsItem[] = all.map(({ ts, ...rest }) => ({ ...rest, time: formatAge(ts) }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
