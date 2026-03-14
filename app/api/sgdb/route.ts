import { NextResponse } from "next/server";

const API_KEY = process.env.STEAMGRIDDB_API_KEY ?? "";
const BASE    = "https://www.steamgriddb.com/api/v2";

const headers = () => ({ Authorization: `Bearer ${API_KEY}` });

export async function POST(req: Request) {
  if (!API_KEY) return NextResponse.json({ error: "STEAMGRIDDB_API_KEY not set" }, { status: 500 });

  const { title } = (await req.json()) as { title: string };
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  try {
    // 1. Search for the game
    const searchRes = await fetch(`${BASE}/search/autocomplete/${encodeURIComponent(title)}`, { headers: headers() });
    const searchData = await searchRes.json() as { success: boolean; data?: { id: number }[] };
    const gameId = searchData.data?.[0]?.id;
    if (!gameId) return NextResponse.json({ cover: null });

    // 2. Fetch portrait grids (600x900)
    const gridRes = await fetch(`${BASE}/grids/game/${gameId}?dimensions=600x900`, { headers: headers() });
    const gridData = await gridRes.json() as { success: boolean; data?: { url: string }[] };
    const cover = gridData.data?.[0]?.url ?? null;

    return NextResponse.json({ cover });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
