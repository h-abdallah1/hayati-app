import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export type ObsidianFile = {
  path: string;   // relative to vault root
  name: string;   // filename without .md
  folder: string; // relative folder path (empty = root)
  mtime: number;
  links: string[];
  tags: string[];
};

const SKIP_DIRS = new Set([".obsidian", ".trash", ".git"]);

function extractLinks(content: string): string[] {
  const links: string[] = [];
  // [[Note Name]] or [[Note Name|alias]]
  for (const m of content.matchAll(/\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g)) {
    links.push(m[1].trim());
  }
  return [...new Set(links)];
}

function extractTags(content: string): string[] {
  const tags: string[] = [];
  // #tag (not inside code blocks or inline code)
  for (const m of content.matchAll(/(?:^|\s)#([a-zA-Z0-9_/\-]+)/g)) {
    tags.push(m[1]);
  }
  return [...new Set(tags)];
}

function walkVault(vaultRoot: string): ObsidianFile[] {
  const files: ObsidianFile[] = [];

  function walk(dir: string, relDir: string) {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        let content = "";
        let mtime = 0;
        try {
          const stat = fs.statSync(fullPath);
          mtime = stat.mtimeMs;
          content = fs.readFileSync(fullPath, "utf-8");
        } catch { continue; }

        files.push({
          path: relPath,
          name: entry.name.replace(/\.md$/, ""),
          folder: relDir,
          mtime,
          links: extractLinks(content),
          tags: extractTags(content),
        });
      }
    }
  }

  walk(vaultRoot, "");
  return files;
}

function guardPath(vaultRoot: string, relPath: string): string | null {
  const resolved = path.resolve(vaultRoot, relPath);
  if (!resolved.startsWith(path.resolve(vaultRoot))) return null;
  return resolved;
}

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get("vault") ?? "";
  if (!vault) return NextResponse.json({ error: "vault required" }, { status: 400 });

  const vaultRoot = path.resolve(vault);
  if (!fs.existsSync(vaultRoot)) return NextResponse.json({ error: "vault not found" }, { status: 404 });

  try {
    const files = walkVault(vaultRoot);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "failed to read vault" }, { status: 500 });
  }
}
