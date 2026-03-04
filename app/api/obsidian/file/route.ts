import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function guardPath(vaultRoot: string, relPath: string): string | null {
  if (!relPath) return null;
  const resolved = path.resolve(vaultRoot, relPath);
  if (!resolved.startsWith(path.resolve(vaultRoot) + path.sep) && resolved !== path.resolve(vaultRoot)) return null;
  return resolved;
}

// GET ?vault=...&path=...  → { content: string }
export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get("vault") ?? "";
  const relPath = req.nextUrl.searchParams.get("path") ?? "";
  if (!vault || !relPath) return NextResponse.json({ error: "vault and path required" }, { status: 400 });

  const abs = guardPath(vault, relPath);
  if (!abs) return NextResponse.json({ error: "invalid path" }, { status: 400 });

  try {
    const content = fs.readFileSync(abs, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }
}

// POST { vault, path, content }  → write/overwrite
export async function POST(req: NextRequest) {
  try {
    const { vault, path: relPath, content } = (await req.json()) as { vault: string; path: string; content: string };
    if (!vault || !relPath) return NextResponse.json({ error: "vault and path required" }, { status: 400 });

    const abs = guardPath(vault, relPath);
    if (!abs) return NextResponse.json({ error: "invalid path" }, { status: 400 });

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content ?? "", "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "write failed" }, { status: 500 });
  }
}

// PUT { vault, path }  → create new empty file
export async function PUT(req: NextRequest) {
  try {
    const { vault, path: relPath } = (await req.json()) as { vault: string; path: string };
    if (!vault || !relPath) return NextResponse.json({ error: "vault and path required" }, { status: 400 });

    const abs = guardPath(vault, relPath);
    if (!abs) return NextResponse.json({ error: "invalid path" }, { status: 400 });

    if (fs.existsSync(abs)) return NextResponse.json({ error: "file exists" }, { status: 409 });

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, "", "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}

// DELETE ?vault=...&path=...  → delete file
export async function DELETE(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get("vault") ?? "";
  const relPath = req.nextUrl.searchParams.get("path") ?? "";
  if (!vault || !relPath) return NextResponse.json({ error: "vault and path required" }, { status: 400 });

  const abs = guardPath(vault, relPath);
  if (!abs) return NextResponse.json({ error: "invalid path" }, { status: 400 });

  try {
    fs.unlinkSync(abs);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
