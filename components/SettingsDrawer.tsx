"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
import { useSettings } from "@/lib/settings";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: Props) {
  const C = useTheme();
  const { settings, updateSettings } = useSettings();

  // General
  const [nameVal, setNameVal] = useState(settings.name);
  const [locLabel, setLocLabel] = useState(settings.location.label);
  const [locLat, setLocLat] = useState(String(settings.location.lat));
  const [locLon, setLocLon] = useState(String(settings.location.lon));
  const [locTz, setLocTz] = useState(settings.location.tz);

  // New feed inputs
  const [newsFeedUrl, setNewsFeedUrl] = useState("");
  const [newsFeedLabel, setNewsFeedLabel] = useState("");
  const [calFeedInput, setCalFeedInput] = useState("");

  // Inline edit state — keyed by the original URL
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Sync general fields when drawer opens
  useEffect(() => {
    if (open) {
      setNameVal(settings.name);
      setLocLabel(settings.location.label);
      setLocLat(String(settings.location.lat));
      setLocLon(String(settings.location.lon));
      setLocTz(settings.location.tz);
      setEditingUrl(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── General handlers ─────────────────────────────────────────────
  const saveName = () => { const v = nameVal.trim(); if (v) updateSettings({ name: v }); };

  const saveLocation = () => {
    const lat = parseFloat(locLat), lon = parseFloat(locLon);
    const tz = locTz.trim(), label = locLabel.trim();
    if (isNaN(lat) || isNaN(lon) || !tz || !label) return;
    updateSettings({ location: { lat, lon, tz, label } });
  };

  // ── News feed handlers ────────────────────────────────────────────
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

  const startEdit = (url: string, label: string) => {
    setEditingUrl(url);
    setEditUrl(url);
    setEditLabel(label);
  };

  const cancelEdit = () => setEditingUrl(null);

  const saveEdit = () => {
    const newUrl = editUrl.trim();
    if (!newUrl || !editingUrl) return;
    // If URL changed, make sure it doesn't clash with another feed
    if (newUrl !== editingUrl && settings.newsFeeds.some(f => f.url === newUrl)) return;
    updateSettings({
      newsFeeds: settings.newsFeeds.map(f =>
        f.url === editingUrl ? { url: newUrl, label: editLabel.trim() } : f
      ),
    });
    setEditingUrl(null);
  };

  // ── Calendar feed handlers ────────────────────────────────────────
  const addCalFeed = () => {
    const v = calFeedInput.trim();
    if (!v) return;
    if (settings.calendarFeeds.includes(v)) { setCalFeedInput(""); return; }
    updateSettings({ calendarFeeds: [...settings.calendarFeeds, v] });
    setCalFeedInput("");
  };

  const removeCalFeed = (url: string) => {
    updateSettings({ calendarFeeds: settings.calendarFeeds.filter(f => f !== url) });
  };

  // ── Shared styles ─────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 6,
    padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
    color: C.text, outline: "none", width: "100%", boxSizing: "border-box",
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4, display: "block",
  };

  const sectionHead: React.CSSProperties = {
    fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.textMuted,
    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12, marginTop: 20,
    paddingBottom: 6, borderBottom: `1px solid ${C.border}`,
  };

  const btnSmall: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer", color: C.textFaint,
    fontSize: 12, padding: "0 3px", flexShrink: 0, lineHeight: 1,
  };

  const addBtn: React.CSSProperties = {
    background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent,
    padding: "5px 10px", flexShrink: 0,
  };

  const saveBtn: React.CSSProperties = {
    ...addBtn, color: C.accent,
  };

  const cancelBtn: React.CSSProperties = {
    ...addBtn, color: C.textFaint,
  };

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }} />
      )}

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 340, zIndex: 50,
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚙</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: C.text }}>Settings</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.textMuted, padding: "2px 4px" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>

          {/* ── General ── */}
          <div style={sectionHead}>General</div>

          <div style={{ marginBottom: 12 }}>
            <span style={fieldLabel}>Display name</span>
            <input value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={saveName} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveName()}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={fieldLabel}>Location label</span>
            <input value={locLabel} onChange={e => setLocLabel(e.target.value)}
              onBlur={saveLocation} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveLocation()}
              style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div>
              <span style={fieldLabel}>Latitude</span>
              <input value={locLat} onChange={e => setLocLat(e.target.value)}
                onBlur={saveLocation} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveLocation()}
                style={inputStyle} />
            </div>
            <div>
              <span style={fieldLabel}>Longitude</span>
              <input value={locLon} onChange={e => setLocLon(e.target.value)}
                onBlur={saveLocation} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveLocation()}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={fieldLabel}>Timezone (IANA)</span>
            <input value={locTz} onChange={e => setLocTz(e.target.value)}
              onBlur={saveLocation} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveLocation()}
              placeholder="e.g. Asia/Dubai" style={inputStyle} />
          </div>

          {/* ── News RSS Feeds ── */}
          <div style={sectionHead}>News RSS Feeds</div>

          {settings.newsFeeds.length === 0 ? (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginBottom: 10 }}>
              No feeds added — using built-in news
            </div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              {settings.newsFeeds.map(f =>
                editingUrl === f.url ? (
                  /* ── Inline edit row ── */
                  <div key={f.url} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="Label (e.g. TechCrunch)"
                      style={{ ...inputStyle, marginBottom: 6 }}
                      autoFocus
                    />
                    <input
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="https://example.com/rss"
                      style={{ ...inputStyle, marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEdit} style={saveBtn}>save</button>
                      <button onClick={cancelEdit} style={cancelBtn}>cancel</button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
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
                    <button onClick={() => startEdit(f.url, f.label)} style={btnSmall} title="Edit">✎</button>
                    <button onClick={() => removeNewsFeed(f.url)} style={btnSmall} title="Remove">✕</button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Add new feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={newsFeedLabel} onChange={e => setNewsFeedLabel(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewsFeed()}
              placeholder="Label (e.g. TechCrunch)" style={inputStyle} />
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newsFeedUrl} onChange={e => setNewsFeedUrl(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addNewsFeed()}
                placeholder="https://example.com/rss" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addNewsFeed} style={addBtn}>add</button>
            </div>
          </div>

          {/* ── Calendar ICS Feeds ── */}
          <div style={sectionHead}>Calendar ICS Feeds</div>

          {settings.calendarFeeds.length === 0 ? (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginBottom: 10 }}>
              No feeds added — using built-in events
            </div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              {settings.calendarFeeds.map(url => (
                <div key={url} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {url.length > 38 ? url.slice(0, 38) + "…" : url}
                  </span>
                  <button onClick={() => removeCalFeed(url)} style={btnSmall} title="Remove">✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            <input value={calFeedInput} onChange={e => setCalFeedInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addCalFeed()}
              placeholder="https://calendar.google.com/…" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addCalFeed} style={addBtn}>add</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, textAlign: "center", flexShrink: 0 }}>
          Changes save automatically
        </div>
      </div>
    </>
  );
}
