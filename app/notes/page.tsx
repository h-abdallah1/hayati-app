"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import type { ObsidianFile } from "@/app/api/obsidian/files/route";

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList = false;

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s: string): string =>
    s
      .replace(/`([^`]+)`/g, (_, c) => `<code style="font-family:'JetBrains Mono',monospace;font-size:0.88em;background:rgba(128,128,128,0.12);padding:1px 5px;border-radius:3px">${esc(c)}</code>`)
      .replace(/\*\*\*(.+?)\*\*\*/g, (_, t) => `<strong><em>${t}</em></strong>`)
      .replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
      .replace(/\*(.+?)\*/g, (_, t) => `<em>${t}</em>`)
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, name, alias) =>
        `<a href="#" data-wikilink="${esc(name.trim())}" style="color:var(--accent);text-decoration:none;border-bottom:1px solid var(--accent-dim)">${esc((alias ?? name).trim())}</a>`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) =>
        `<a href="${esc(url)}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none">${esc(text)}</a>`)
      .replace(/(?:^|\s)(#[a-zA-Z0-9_/\-]+)/g, (_, tag) =>
        ` <span style="color:var(--accent);font-size:0.85em;opacity:0.8">${esc(tag)}</span>`);

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { out.push("</code></pre>"); inCode = false; }
      else {
        if (inList) { out.push("</ul>"); inList = false; }
        out.push(`<pre style="background:rgba(128,128,128,0.08);padding:14px 16px;border-radius:6px;overflow-x:auto;margin:12px 0;border:1px solid rgba(128,128,128,0.15)"><code style="font-family:'JetBrains Mono',monospace;font-size:12px">`);
        inCode = true;
      }
      continue;
    }
    if (inCode) { out.push(esc(line) + "\n"); continue; }

    if (/^#{1,6}\s/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      const level = line.match(/^(#+)/)?.[1].length ?? 1;
      const text = line.replace(/^#+\s/, "");
      const sizes = ["1.9em", "1.5em", "1.25em", "1.1em", "1em", "0.95em"];
      const mt = level === 1 ? "28px" : "20px";
      out.push(`<h${level} style="font-family:'Syne',sans-serif;font-size:${sizes[level-1]};font-weight:700;margin:${mt} 0 8px;line-height:1.25">${inline(esc(text))}</h${level}>`);
      continue;
    }

    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      if (!inList) { out.push(`<ul style="margin:6px 0;padding-left:22px">`); inList = true; }
      out.push(`<li style="margin:3px 0;line-height:1.7">${inline(esc(line.replace(/^[-*+]\s/, "").replace(/^\d+\.\s/, "")))}</li>`);
      continue;
    }
    if (inList && line.trim() === "") { out.push("</ul>"); inList = false; }

    if (line.startsWith("> ")) {
      out.push(`<blockquote style="border-left:3px solid var(--accent-dim);margin:8px 0;padding:4px 14px;opacity:0.8;font-style:italic">${inline(esc(line.slice(2)))}</blockquote>`);
      continue;
    }
    if (line.trim() === "") { if (inList) { out.push("</ul>"); inList = false; } out.push(`<div style="height:8px"></div>`); continue; }
    if (/^---+$/.test(line.trim())) { out.push(`<hr style="border:none;border-top:1px solid rgba(128,128,128,0.2);margin:20px 0"/>`); continue; }

    out.push(`<p style="margin:0 0 2px;line-height:1.75">${inline(esc(line))}</p>`);
  }

  if (inList) out.push("</ul>");
  if (inCode) out.push("</code></pre>");
  return out.join("");
}

// ── Graph view ────────────────────────────────────────────────────────────────

import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

type GNode = SimulationNodeDatum & { id: string; name: string; linkCount: number };
type GLink = SimulationLinkDatum<GNode> & { source: GNode; target: GNode };

function GraphView({ files, selectedPath, onSelect, C }: {
  files: ObsidianFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  C: ReturnType<typeof useTheme>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GNode[]>([]);
  const [links, setLinks] = useState<GLink[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0, k: 1 });
  const dragging = useRef<{ nodeId: string; ox: number; oy: number } | null>(null);
  const panDragging = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const simRef = useRef<import("d3-force").Simulation<GNode, GLink> | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (files.length === 0) return;
    import("d3-force").then(d3 => {
      const nameToPath = new Map(files.map(f => [f.name.toLowerCase(), f.path]));
      const nodeMap = new Map<string, GNode>();
      for (const f of files) nodeMap.set(f.path, { id: f.path, name: f.name, linkCount: 0 });
      const rawLinks: { source: string; target: string }[] = [];
      for (const f of files) {
        for (const link of f.links) {
          const tp = nameToPath.get(link.toLowerCase());
          if (tp && tp !== f.path) {
            rawLinks.push({ source: f.path, target: tp });
            nodeMap.get(f.path)!.linkCount++;
            nodeMap.get(tp)!.linkCount++;
          }
        }
      }
      const ns = [...nodeMap.values()];
      const W = 320, H = svgRef.current?.clientHeight ?? 500;
      ns.forEach(n => { n.x = W / 2 + (Math.random() - 0.5) * 200; n.y = H / 2 + (Math.random() - 0.5) * 200; });
      const ls = rawLinks.map(l => ({ source: nodeMap.get(l.source)!, target: nodeMap.get(l.target)! })) as GLink[];
      const sim = d3.forceSimulation<GNode>(ns)
        .force("link", d3.forceLink<GNode, GLink>(ls).id(d => d.id).distance(60).strength(0.5))
        .force("charge", d3.forceManyBody<GNode>().strength(-80))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force("collision", d3.forceCollide<GNode>(d => 8 + d.linkCount * 2));
      simRef.current = sim;
      sim.on("tick", () => setTick(t => t + 1));
      setNodes(ns); setLinks(ls);
      return () => { sim.stop(); };
    });
  }, [files]);

  void tick;

  return (
    <svg ref={svgRef} style={{ width: "100%", height: "100%", cursor: "grab" }}
      onMouseDown={e => {
        if (e.target === svgRef.current || (e.target as SVGElement).tagName === "svg")
          panDragging.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      }}
      onMouseMove={e => {
        if (dragging.current) {
          const node = nodes.find(n => n.id === dragging.current!.nodeId);
          if (node) { node.x = (e.clientX - dragging.current.ox - pan.x) / pan.k; node.y = (e.clientY - dragging.current.oy - pan.y) / pan.k; node.fx = node.x; node.fy = node.y; simRef.current?.alpha(0.1).restart(); }
        } else if (panDragging.current) {
          setPan(p => ({ ...p, x: panDragging.current!.px + e.clientX - panDragging.current!.sx, y: panDragging.current!.py + e.clientY - panDragging.current!.sy }));
        }
      }}
      onMouseUp={() => {
        if (dragging.current) { const n = nodes.find(n => n.id === dragging.current!.nodeId); if (n) { n.fx = null; n.fy = null; } dragging.current = null; }
        panDragging.current = null;
      }}
      onMouseLeave={() => { dragging.current = null; panDragging.current = null; }}
      onWheel={e => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 0.9; setPan(p => ({ ...p, k: Math.max(0.2, Math.min(4, p.k * f)) })); }}
    >
      <g transform={`translate(${pan.x},${pan.y}) scale(${pan.k})`}>
        {links.map((l, i) => (
          <line key={i} x1={l.source.x ?? 0} y1={l.source.y ?? 0} x2={l.target.x ?? 0} y2={l.target.y ?? 0}
            stroke={C.border} strokeWidth={1} opacity={0.5} />
        ))}
        {nodes.map(n => {
          const r = 4 + Math.min(n.linkCount, 8) * 1.5;
          const sel = n.id === selectedPath;
          return (
            <g key={n.id} transform={`translate(${n.x ?? 0},${n.y ?? 0})`} style={{ cursor: "pointer" }}
              onMouseDown={e => { e.stopPropagation(); dragging.current = { nodeId: n.id, ox: e.clientX - (n.x ?? 0) * pan.k - pan.x, oy: e.clientY - (n.y ?? 0) * pan.k - pan.y }; simRef.current?.alphaTarget(0.3).restart(); }}
              onClick={() => onSelect(n.id)}>
              <circle r={r} fill={sel ? C.accent : C.surfaceHi} stroke={sel ? C.accent : C.borderHi} strokeWidth={1.5} />
              {(sel || n.linkCount > 2) && (
                <text y={r + 10} textAnchor="middle" style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fill: C.textFaint, pointerEvents: "none", userSelect: "none" }}>
                  {n.name.length > 16 ? n.name.slice(0, 14) + "…" : n.name}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const { global } = useGlobalSettings();
  const vault = global.obsidianVaultPath ?? "";

  const [files, setFiles] = useState<ObsidianFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [mode, setMode] = useState<"edit" | "preview" | "backlinks">("edit");
  const [showGraph, setShowGraph] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ path: string; name: string; excerpt: string }[] | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  // inline title editing
  const [titleVal, setTitleVal] = useState("");
  const [titleEditing, setTitleEditing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Tab management ───────────────────────────────────────────────────────
  const openNote = useCallback((path: string) => {
    setTabs(prev => prev.includes(path) ? prev : [...prev, path]);
    setSelectedPath(path);
  }, []);

  const closeTab = useCallback((path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTabs(prev => {
      const idx = prev.indexOf(path);
      const next = prev.filter(p => p !== path);
      if (path === selectedPath) {
        setSelectedPath(next[Math.max(0, idx - 1)] ?? null);
      }
      return next;
    });
  }, [selectedPath]);

  // ── Load file list ───────────────────────────────────────────────────────
  const loadFiles = useCallback(async () => {
    if (!vault) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/obsidian/files?vault=${encodeURIComponent(vault)}`);
      const data = await res.json() as { files?: ObsidianFile[] };
      setFiles((data.files ?? []).sort((a, b) => b.mtime - a.mtime));
    } catch { /* ignore */ }
    setLoading(false);
  }, [vault]);

  useEffect(() => { if (vault) loadFiles(); }, [vault, loadFiles]);

  // ── Load file content ────────────────────────────────────────────────────
  const loadFile = useCallback(async (relPath: string) => {
    if (!vault) return;
    try {
      const res = await fetch(`/api/obsidian/file?vault=${encodeURIComponent(vault)}&path=${encodeURIComponent(relPath)}`);
      const data = await res.json() as { content?: string };
      const c = data.content ?? "";
      setContent(c); setSavedContent(c);
    } catch { setContent(""); setSavedContent(""); }
  }, [vault]);

  useEffect(() => {
    if (selectedPath) { loadFile(selectedPath); setMode("edit"); setTitleEditing(false); }
  }, [selectedPath, loadFile]);

  // ── Sync inline title ────────────────────────────────────────────────────
  const selectedFile = useMemo(() => files.find(f => f.path === selectedPath) ?? null, [files, selectedPath]);

  useEffect(() => {
    if (selectedFile && !titleEditing) setTitleVal(selectedFile.name);
  }, [selectedFile?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ────────────────────────────────────────────────────────────
  const autoSave = useCallback((relPath: string, c: string) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/obsidian/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vault, path: relPath, content: c }) });
        setSavedContent(c);
        loadFiles();
      } catch { /* ignore */ }
    }, 500);
  }, [vault, loadFiles]);

  // ── Rename (via inline title) ────────────────────────────────────────────
  const commitTitleRename = async () => {
    setTitleEditing(false);
    if (!selectedPath || !vault || !titleVal.trim()) { if (selectedFile) setTitleVal(selectedFile.name); return; }
    const newName = titleVal.trim().replace(/\.md$/, "") + ".md";
    const dir = selectedPath.includes("/") ? selectedPath.slice(0, selectedPath.lastIndexOf("/")) : "";
    const newPath = dir ? `${dir}/${newName}` : newName;
    if (newPath === selectedPath) return;
    try {
      await fetch("/api/obsidian/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vault, path: newPath, content }) });
      await fetch(`/api/obsidian/file?vault=${encodeURIComponent(vault)}&path=${encodeURIComponent(selectedPath)}`, { method: "DELETE" });
      await loadFiles();
      // replace old tab with new path
      setTabs(prev => prev.map(p => p === selectedPath ? newPath : p));
      setSelectedPath(newPath);
    } catch { if (selectedFile) setTitleVal(selectedFile.name); }
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearchInput = (q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/obsidian/search?vault=${encodeURIComponent(vault)}&q=${encodeURIComponent(q)}`);
        const data = await res.json() as { results: { path: string; name: string; excerpt: string }[] };
        setSearchResults(data.results ?? []);
      } catch { setSearchResults([]); }
    }, 300);
  };

  // ── New note ─────────────────────────────────────────────────────────────
  const newNote = async (folder = "") => {
    if (!vault) return;
    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const relPath = folder ? `${folder}/Untitled ${ts}.md` : `Untitled ${ts}.md`;
    try {
      await fetch("/api/obsidian/file", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vault, path: relPath }) });
      await loadFiles(); openNote(relPath);
    } catch { /* ignore */ }
  };

  // ── Daily note ───────────────────────────────────────────────────────────
  const openDailyNote = async () => {
    if (!vault) return;
    const today = new Date().toISOString().slice(0, 10);
    const hasDailyFolder = files.some(f => f.folder === "Daily Notes" || f.folder.startsWith("Daily Notes/"));
    const relPath = hasDailyFolder ? `Daily Notes/${today}.md` : `${today}.md`;
    if (files.find(f => f.path === relPath)) { openNote(relPath); return; }
    try {
      await fetch("/api/obsidian/file", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vault, path: relPath }) });
      await loadFiles(); openNote(relPath);
    } catch { /* ignore */ }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteFile = async () => {
    if (!selectedPath || !vault) return;
    if (!confirm(`Delete "${selectedFile?.name}"?`)) return;
    try {
      await fetch(`/api/obsidian/file?vault=${encodeURIComponent(vault)}&path=${encodeURIComponent(selectedPath)}`, { method: "DELETE" });
      setContent(""); await loadFiles(); closeTab(selectedPath);
    } catch { /* ignore */ }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) for (const t of f.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [files]);

  const filteredFiles = useMemo(() =>
    activeTag ? files.filter(f => f.tags.includes(activeTag)) : files,
  [files, activeTag]);

  const folderGroups = useMemo(() => {
    const groups = new Map<string, ObsidianFile[]>();
    for (const f of filteredFiles) {
      const folder = f.folder || "";
      if (!groups.has(folder)) groups.set(folder, []);
      groups.get(folder)!.push(f);
    }
    return groups;
  }, [filteredFiles]);

  const backlinks = useMemo(() => {
    if (!selectedFile) return [];
    const nameLower = selectedFile.name.toLowerCase();
    return files.filter(f => f.path !== selectedPath && f.links.some(l => l.toLowerCase() === nameLower));
  }, [files, selectedFile, selectedPath]);

  const isDirty = content !== savedContent;

  const wordCount = useMemo(() =>
    content.trim() ? content.trim().split(/\s+/).length : 0,
  [content]);

  const previewHtml = useMemo(() => mode === "preview" ? renderMarkdown(content) : "", [mode, content]);

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest("[data-wikilink]");
    if (link) {
      e.preventDefault();
      const name = link.getAttribute("data-wikilink") ?? "";
      const match = files.find(f => f.name.toLowerCase() === name.toLowerCase());
      if (match) openNote(match.path);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };
  const syne: React.CSSProperties = { fontFamily: "'Syne',sans-serif" };
  const vaultName = vault.split("/").pop() || "Vault";

  // ── No vault ─────────────────────────────────────────────────────────────
  if (!vault) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ ...syne, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10 }}>No vault configured</div>
          <div style={{ ...mono, fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
            Open Settings → General and set your Obsidian vault path to get started.
          </div>
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div style={{
        width: 260, background: isDark ? "rgba(10, 10, 18, 0.60)" : "rgba(248, 248, 244, 0.68)", backdropFilter: "blur(20px) saturate(1.6)", WebkitBackdropFilter: "blur(20px) saturate(1.6)", borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
      }}>

        {/* Vault header */}
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ ...syne, fontWeight: 700, fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {vaultName}
            </span>
            <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
              {[
                { label: "☀", title: "Daily note", action: openDailyNote },
                { label: "+", title: "New note", action: () => newNote() },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} title={btn.title} style={{
                  background: "none", border: "none", cursor: "pointer", padding: "2px 5px",
                  color: C.textFaint, fontSize: btn.label === "+" ? 17 : 13, lineHeight: 1,
                }}
                  onMouseEnter={e => { (e.currentTarget).style.color = C.text; }}
                  onMouseLeave={e => { (e.currentTarget).style.color = C.textFaint; }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.textFaint, fontSize: 11, pointerEvents: "none" }}>⌕</span>
            <input
              value={searchQ}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="Search…"
              style={{
                ...mono, width: "100%", boxSizing: "border-box", paddingLeft: 24,
                background: C.surfaceHi, border: `1px solid ${C.border}`,
                borderRadius: 5, padding: "5px 8px 5px 24px",
                fontSize: 11, color: C.text, outline: "none",
              }}
            />
          </div>
        </div>

        {/* File list / search results */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {searchResults !== null ? (
            /* ── Search results ─────────────────── */
            <div>
              <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ ...mono, fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </span>
                <button onClick={() => { setSearchQ(""); setSearchResults(null); }}
                  style={{ ...mono, background: "none", border: "none", cursor: "pointer", fontSize: 9, color: C.textFaint, padding: 0 }}>
                  clear
                </button>
              </div>
              {searchResults.map(r => (
                <div key={r.path}
                  onClick={() => { openNote(r.path); setSearchQ(""); setSearchResults(null); }}
                  style={{ padding: "7px 14px", cursor: "pointer", background: selectedPath === r.path ? C.surfaceHi : "transparent" }}
                  onMouseEnter={e => { if (selectedPath !== r.path) (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                  onMouseLeave={e => { if (selectedPath !== r.path) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                  <div style={{ ...mono, fontSize: 12, color: C.text, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ ...mono, fontSize: 10, color: C.textFaint, lineHeight: 1.5 }}>{r.excerpt}</div>
                </div>
              ))}
            </div>

          ) : (
            /* ── File tree ──────────────────────── */
            <div>
              {loading && (
                <div style={{ ...mono, fontSize: 10, color: C.textFaint, padding: "14px 16px" }}>loading…</div>
              )}

              {/* Folders first, then root files */}
              {[...folderGroups.entries()].map(([folder, folderFiles]) => {
                const isCollapsed = collapsedFolders.has(folder);
                const hasFolder = folder !== "";
                return (
                  <div key={folder || "__root__"}>
                    {/* Folder row */}
                    {hasFolder && (
                      <div
                        onClick={() => setCollapsedFolders(prev => {
                          const next = new Set(prev);
                          if (next.has(folder)) next.delete(folder); else next.add(folder);
                          return next;
                        })}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", cursor: "pointer",
                          color: C.textMuted,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                        <span style={{ fontSize: 8, opacity: 0.6, transition: "transform 0.1s", display: "inline-block", transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}>▶</span>
                        <span style={{ ...mono, fontSize: 11 }}>
                          {folder.split("/").pop()}
                        </span>
                        <span style={{ ...mono, fontSize: 9, color: C.textFaint, marginLeft: "auto" }}>{folderFiles.length}</span>
                      </div>
                    )}

                    {/* Files in folder */}
                    {!isCollapsed && folderFiles.map(f => {
                      const isActive = selectedPath === f.path;
                      return (
                        <div key={f.path}
                          onClick={() => openNote(f.path)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: `5px 12px 5px ${hasFolder ? 24 : 12}px`,
                            cursor: "pointer",
                            background: isActive ? C.accentDim : "transparent",
                            borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                          <span style={{ ...mono, fontSize: 11, color: isActive ? C.accent : C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                            {f.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Tags section */}
              {allTags.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
                  <div
                    onClick={() => setTagsOpen(o => !o)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", cursor: "pointer", color: C.textMuted }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.surfaceHi; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                    <span style={{ fontSize: 8, opacity: 0.6, display: "inline-block", transform: tagsOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    <span style={{ ...mono, fontSize: 11 }}>Tags</span>
                    <span style={{ ...mono, fontSize: 9, color: C.textFaint, marginLeft: "auto" }}>{allTags.length}</span>
                  </div>
                  {tagsOpen && (
                    <div style={{ padding: "4px 12px 8px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {activeTag && (
                        <button onClick={() => setActiveTag(null)} style={{
                          ...mono, background: C.accentDim, border: `1px solid ${C.accent}`,
                          borderRadius: 4, padding: "2px 7px", fontSize: 9, cursor: "pointer", color: C.accent,
                        }}>
                          clear filter ×
                        </button>
                      )}
                      {allTags.map(([tag, count]) => (
                        <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                          ...mono, background: activeTag === tag ? C.accentDim : C.surfaceHi,
                          border: `1px solid ${activeTag === tag ? C.accent : C.border}`,
                          borderRadius: 4, padding: "2px 7px", fontSize: 9, cursor: "pointer",
                          color: activeTag === tag ? C.accent : C.textMuted,
                        }}>
                          #{tag} <span style={{ opacity: 0.5 }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ EDITOR ═══════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0,
        background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
        backdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
      }}>
        <>
            {/* Tab bar */}
            <div style={{
              height: 36, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
              display: "flex", alignItems: "stretch", background: isDark ? "rgba(14, 14, 22, 0.55)" : "rgba(255,255,255,0.60)",
            }}>
              {/* Scrollable tabs */}
              <div style={{ flex: 1, display: "flex", alignItems: "stretch", overflowX: "auto", minWidth: 0 }}>
                {tabs.map(path => {
                  const tabFile = files.find(f => f.path === path);
                  const name = tabFile?.name ?? path.split("/").pop()?.replace(/\.md$/, "") ?? "…";
                  const isActive = path === selectedPath;
                  return (
                    <div key={path} onClick={() => setSelectedPath(path)} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "0 6px 0 12px", cursor: "pointer", flexShrink: 0,
                      borderRight: `1px solid ${C.border}`,
                      background: isActive ? C.bg : "transparent",
                      borderBottom: isActive ? `1px solid ${C.bg}` : "none",
                      position: "relative", top: isActive ? 1 : 0,
                      maxWidth: 180,
                    }}>
                      <span style={{
                        ...mono, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        color: isActive ? C.text : C.textMuted,
                      }}>
                        {name}
                      </span>
                      {isActive && isDirty && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />}
                      <button onClick={e => closeTab(path, e)} style={{
                        background: "none", border: "none", cursor: "pointer", flexShrink: 0,
                        fontSize: 14, lineHeight: 1, padding: "0 2px",
                        color: isActive ? C.textFaint : "transparent",
                      }}
                        onMouseEnter={e => { (e.currentTarget).style.color = C.text; }}
                        onMouseLeave={e => { (e.currentTarget).style.color = isActive ? C.textFaint : "transparent"; }}>
                        ×
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => newNote()} title="New note" style={{
                  ...mono, background: "none", border: "none", cursor: "pointer",
                  fontSize: 18, color: C.textFaint, padding: "0 10px", flexShrink: 0, alignSelf: "center",
                }}
                  onMouseEnter={e => { (e.currentTarget).style.color = C.text; }}
                  onMouseLeave={e => { (e.currentTarget).style.color = C.textFaint; }}>
                  +
                </button>
              </div>

              {/* Right controls — only visible when a note is open */}
              {selectedFile && <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: 10, paddingLeft: 8, flexShrink: 0, borderLeft: `1px solid ${C.border}` }}>
                {(["edit", "preview", "backlinks"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    ...mono, background: mode === m ? C.surfaceHi : "none",
                    border: "none", borderRadius: 4, cursor: "pointer",
                    fontSize: 10, padding: "3px 8px",
                    color: mode === m ? C.text : C.textFaint,
                  }}>
                    {m === "backlinks" ? `backlinks (${backlinks.length})` : m}
                  </button>
                ))}
                <div style={{ width: 1, height: 16, background: C.border, margin: "0 3px" }} />
                <button onClick={() => setShowGraph(g => !g)} style={{
                  ...mono, background: showGraph ? C.accentDim : "none",
                  border: `1px solid ${showGraph ? C.accent : "transparent"}`,
                  borderRadius: 4, cursor: "pointer", fontSize: 10,
                  color: showGraph ? C.accent : C.textFaint, padding: "3px 8px",
                }}>
                  graph
                </button>
                <div style={{ width: 1, height: 16, background: C.border, margin: "0 3px" }} />
                <button onClick={deleteFile} title="Delete note" style={{
                  ...mono, background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, color: C.textFaint, padding: "2px 4px", lineHeight: 1,
                }}
                  onMouseEnter={e => { (e.currentTarget).style.color = C.red; }}
                  onMouseLeave={e => { (e.currentTarget).style.color = C.textFaint; }}>
                  🗑
                </button>
              </div>}
            </div>

            {/* Content */}
            {selectedFile ? (<><div style={{ flex: 1, overflowY: "auto" }}>
              {(mode === "edit" || mode === "preview") && (
                <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 48px 80px" }}>

                  {/* Inline title */}
                  <input
                    value={titleVal}
                    onChange={e => { setTitleEditing(true); setTitleVal(e.target.value); }}
                    onBlur={commitTitleRename}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitTitleRename(); } if (e.key === "Escape") { setTitleEditing(false); if (selectedFile) setTitleVal(selectedFile.name); } }}
                    style={{
                      ...syne, fontWeight: 800, fontSize: 30, color: C.text,
                      background: "transparent", border: "none", outline: "none",
                      width: "100%", padding: 0, marginBottom: 32, lineHeight: 1.2,
                      letterSpacing: "-0.5px",
                    }}
                  />

                  {mode === "edit" ? (
                    <textarea
                      value={content}
                      onChange={e => { setContent(e.target.value); if (selectedPath) autoSave(selectedPath, e.target.value); }}
                      style={{
                        ...mono, width: "100%", resize: "none", background: "transparent",
                        border: "none", outline: "none", color: C.text,
                        fontSize: 13, lineHeight: 1.8, padding: 0,
                        minHeight: "60vh",
                      }}
                    />
                  ) : (
                    <div
                      onClick={handlePreviewClick}
                      style={{
                        fontSize: 14, lineHeight: 1.8, color: C.text,
                        ["--accent" as string]: C.accent,
                        ["--accent-dim" as string]: C.accentDim,
                      }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  )}
                </div>
              )}

              {mode === "backlinks" && (
                <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 48px 80px" }}>
                  <div style={{ ...syne, fontSize: 14, fontWeight: 700, color: C.textMuted, marginBottom: 20 }}>
                    Linked mentions — {backlinks.length} note{backlinks.length !== 1 ? "s" : ""} link here
                  </div>
                  {backlinks.length === 0 ? (
                    <div style={{ ...mono, fontSize: 12, color: C.textFaint }}>No other notes link to this one.</div>
                  ) : backlinks.map(f => (
                    <div key={f.path} onClick={() => openNote(f.path)}
                      style={{
                        padding: "10px 14px", borderRadius: 6, cursor: "pointer", marginBottom: 6,
                        background: C.surface, border: `1px solid ${C.border}`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderHi; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}>
                      <div style={{ ...mono, fontSize: 12, color: C.text, marginBottom: 2 }}>{f.name}</div>
                      <div style={{ ...mono, fontSize: 10, color: C.textFaint }}>{f.folder || "root"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div style={{
              height: 24, borderTop: `1px solid ${C.border}`, flexShrink: 0,
              display: "flex", alignItems: "center", padding: "0 16px", gap: 20,
            }}>
              <span style={{ ...mono, fontSize: 9, color: C.textFaint }}>{wordCount} words</span>
              <span style={{ ...mono, fontSize: 9, color: C.textFaint }}>
                {selectedFile.folder ? `${selectedFile.folder}/` : ""}{selectedFile.name}.md
              </span>
              {isDirty && <span style={{ ...mono, fontSize: 9, color: C.accent, marginLeft: "auto" }}>saving…</span>}
            </div>
          </>) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ ...mono, fontSize: 11, color: C.textFaint, marginBottom: 6 }}>
                {loading ? "loading vault…" : files.length === 0 ? "vault is empty" : "no note open"}
              </div>
              {!loading && (
                <button onClick={() => newNote()} style={{
                  ...mono, background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 5, cursor: "pointer", fontSize: 11, color: C.textMuted, padding: "6px 14px",
                }}
                  onMouseEnter={e => { (e.currentTarget).style.borderColor = C.accent; (e.currentTarget).style.color = C.accent; }}
                  onMouseLeave={e => { (e.currentTarget).style.borderColor = C.border; (e.currentTarget).style.color = C.textMuted; }}>
                  + new note
                </button>
              )}
            </div>
          </div>
          )}
        </>
      </div>

      {/* ══ GRAPH PANEL ══════════════════════════════════════════════════════ */}
      {showGraph && (
        <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, background: isDark ? "rgba(10, 10, 18, 0.60)" : "rgba(248, 248, 244, 0.68)", backdropFilter: "blur(20px) saturate(1.6)", WebkitBackdropFilter: "blur(20px) saturate(1.6)" }}>
          <div style={{ height: 36, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
            <span style={{ ...syne, fontWeight: 700, fontSize: 12, color: C.textMuted }}>Graph</span>
            <span style={{ ...mono, fontSize: 9, color: C.textFaint }}>{files.length} notes</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <GraphView files={files} selectedPath={selectedPath} onSelect={openNote} C={C} />
          </div>
        </div>
      )}
    </div>
  );
}
