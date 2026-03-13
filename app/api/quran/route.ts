import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ayah = searchParams.get("ayah");
  if (!ayah) return NextResponse.json({ error: "Missing ayah" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${ayah}/editions/quran-uthmani,en.asad`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });

    const data = await res.json();
    const ar = data.data[0];
    const en = data.data[1];

    return NextResponse.json({
      arabic:      ar.text,
      translation: en.text,
      ref:         `${ar.surah.englishName} ${ar.surah.number}:${ar.numberInSurah}`,
      url:         `https://quran.com/${ar.surah.number}/${ar.numberInSurah}`,
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
