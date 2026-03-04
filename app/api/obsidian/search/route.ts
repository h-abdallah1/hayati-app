import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SKIP_DIRS = new Set([".obsidian", ".trash", ".git"]);

function walkMd(dir: string, relDir: string, acc: { abs: string; rel: string; name: string }[]) {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) walkMd(full, rel, acc);
    else if (e.isFile() && e.name.endsWith(".md")) acc.push({ abs: full, rel, name: e.name.replace(/\.md$/, "") });
  }
}

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get("vault") ?? "";
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  if (!vault || !q) return NextResponse.json({ results: [] });

  const vaultRoot = path.resolve(vault);
  if (!fs.existsSync(vaultRoot)) return NextResponse.json({ results: [] });

  const mdFiles: { abs: string; rel: string; name: string }[] = [];
  walkMd(vaultRoot, "", mdFiles);

  const results: { path: string; name: string; excerpt: string }[] = [];

  for (const f of mdFiles) {
    let content = "";
    try { content = fs.readFileSync(f.abs, "utf-8"); } catch { continue; }

    const lower = content.toLowerCase();
    const titleMatch = f.name.toLowerCase().includes(q);
    const bodyIdx = lower.indexOf(q);

    if (!titleMatch && bodyIdx === -1) continue;

    let excerpt = "";
    if (bodyIdx !== -1) {
      const start = Math.max(0, bodyIdx - 60);
      const end = Math.min(content.length, bodyIdx + q.length + 120);
      excerpt = (start > 0 ? "…" : "") + content.slice(start, end).replace(/\n+/g, " ").trim() + (end < content.length ? "…" : "");
    } else {
      excerpt = content.slice(0, 120).replace(/\n+/g, " ").trim() + (content.length > 120 ? "…" : "");
    }

    results.push({ path: f.rel, name: f.name, excerpt });
    if (results.length >= 30) break;
  }

  return NextResponse.json({ results });
}
