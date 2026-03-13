import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT key, value FROM kv").all() as { key: string; value: string }[];
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = (await req.json()) as { key: string; value: string };
    if (typeof key !== "string" || typeof value !== "string") {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }
    const db = getDb();
    db.prepare(
      "INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
    ).run(key, value, Date.now());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
