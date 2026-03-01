"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
import { useSettings } from "@/lib/settings";
import { inputStyle, sectionHead, btnSmall, addBtn, cancelBtn } from "./styles";

interface Props {
  open: boolean;
}

export function NewsFeedsSection({ open }: Props) {
  const C = useTheme();
  const { settings, updateSettings } = useSettings();
  const [newsFeedUrl, setNewsFeedUrl] = useState("");
  const [newsFeedLabel, setNewsFeedLabel] = useState("");
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    if (open) setEditingUrl(null);
  }, [open]);

  const addNewsFeed = () => {
    const url = newsFeedUrl.trim();
    if (!url) return;
    if (settings.newsFeeds.some(f => f.url === url)) { setNewsFeedUrl(""); setNewsFeedLabel(""); return; }
    updateSettings({ newsFeeds: [...settings.newsFeeds, { url, label: newsFeedLabel.trim() }] });
    setNewsFeedUrl("");
    setNewsFeedLabel("");
  };

  const removeNewsFeed = (url: string) => {
    if (editingUrl === url) setEditingUrl(null);
    updateSettings({ newsFeeds: settings.newsFeeds.filter(f => f.url !== url) });
  };

  const startEdit = (url: string, label: string) => { setEditingUrl(url); setEditUrl(url); setEditLabel(label); };
  const cancelEdit = () => setEditingUrl(null);
  const saveEdit = () => {
    const newUrl = editUrl.trim();
    if (!newUrl || !editingUrl) return;
    if (newUrl !== editingUrl && settings.newsFeeds.some(f => f.url === newUrl)) return;
    updateSettings({ newsFeeds: settings.newsFeeds.map(f => f.url === editingUrl ? { url: newUrl, label: editLabel.trim() } : f) });
    setEditingUrl(null);
  };

  return (
    <>
      <div style={sectionHead(C)}>News RSS Feeds</div>

      {settings.newsFeeds.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginBottom: 10 }}>
          No feeds added — using built-in news
        </div>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {settings.newsFeeds.map(f =>
            editingUrl === f.url ? (
              <div key={f.url} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="Label (e.g. TechCrunch)" style={{ ...inputStyle(C), marginBottom: 6 }} autoFocus />
                <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                  placeholder="https://example.com/rss" style={{ ...inputStyle(C), marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEdit} style={addBtn(C)}>save</button>
                  <button onClick={cancelEdit} style={cancelBtn(C)}>cancel</button>
                </div>
              </div>
            ) : (
              <div key={f.url} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {f.label && (
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.label}
                    </div>
                  )}
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.url.length > 42 ? f.url.slice(0, 42) + "…" : f.url}
                  </div>
                </div>
                <button onClick={() => startEdit(f.url, f.label)} style={btnSmall(C)} title="Edit">✎</button>
                <button onClick={() => removeNewsFeed(f.url)} style={btnSmall(C)} title="Remove">✕</button>
              </div>
            )
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={newsFeedLabel} onChange={e => setNewsFeedLabel(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewsFeed()}
          placeholder="Label (e.g. TechCrunch)" style={inputStyle(C)} />
        <div style={{ display: "flex", gap: 6 }}>
          <input value={newsFeedUrl} onChange={e => setNewsFeedUrl(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewsFeed()}
            placeholder="https://example.com/rss" style={{ ...inputStyle(C), flex: 1 }} />
          <button onClick={addNewsFeed} style={addBtn(C)}>add</button>
        </div>
      </div>
    </>
  );
}
