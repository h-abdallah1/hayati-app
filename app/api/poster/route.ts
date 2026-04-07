import { NextRequest, NextResponse } from "next/server";

// Fetch a movie poster thumbnail from Wikipedia's free REST API (no auth required).
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const year  = req.nextUrl.searchParams.get("year") ?? "";
  if (!title) return NextResponse.json({ url: null });

  const candidates = [
    `${title} (${year} film)`,
    `${title} (film)`,
    title,
  ];

  for (const candidate of candidates) {
    try {
      const slug = encodeURIComponent(candidate.trim().replace(/ /g, "_"));
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        { headers: { "User-Agent": "Hayati/1.0 (demo mode poster fetch)" }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) continue;
      const data = await res.json() as { thumbnail?: { source: string }; type?: string };
      if (data.thumbnail?.source) return NextResponse.json({ url: data.thumbnail.source });
    } catch { continue; }
  }

  return NextResponse.json({ url: null });
}
