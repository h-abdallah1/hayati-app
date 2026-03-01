"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
import { useSettings } from "@/lib/settings";
import type { LocationCoords } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Location resolution helpers ──────────────────────────────────────────────

async function detectLocation(): Promise<LocationCoords> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { "Accept-Language": "en" } }
  );
  const d = await r.json();
  const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || d.name || "";
  const country = d.address?.country_code?.toUpperCase() || "";
  const label = [city, country].filter(Boolean).join(", ") || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  return { lat, lon, tz, label };
}

async function searchLocation(query: string): Promise<LocationCoords> {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const results = await r.json();
  if (!results[0]) throw new Error("Location not found");

  const { lat: latStr, lon: lonStr, address } = results[0];
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const city = address?.city || address?.town || address?.village || address?.state || query;
  const country = address?.country_code?.toUpperCase() || "";
  const label = [city, country].filter(Boolean).join(", ");

  const tzR = await fetch(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`);
  const tzD = await tzR.json();
  const tz: string = tzD.timeZone || "UTC";

  return { lat, lon, tz, label };
}

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsDrawer({ open, onClose }: Props) {
  const C = useTheme();
  const { settings, updateSettings } = useSettings();

  // General
  const [nameVal, setNameVal] = useState(settings.name);

  // Location
  const [locSearch, setLocSearch] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  // News feeds
  const [newsFeedUrl, setNewsFeedUrl] = useState("");
  const [newsFeedLabel, setNewsFeedLabel] = useState("");

  // Calendar feeds
  const [calFeedInput, setCalFeedInput] = useState("");

  // Inline edit state for news feeds
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Sync when drawer opens
  useEffect(() => {
    if (open) {
      setNameVal(settings.name);
      setLocSearch("");
      setLocError("");
      setEditingUrl(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────

  const saveName = () => { const v = nameVal.trim(); if (v) updateSettings({ name: v }); };

  const applyLocation = (loc: LocationCoords) => {
    updateSettings({ location: loc });
    setLocSearch("");
    setLocError("");
  };

  const handleAutodetect = async () => {
    setLocLoading(true);
    setLocError("");
    try {
      applyLocation(await detectLocation());
    } catch (e) {
      setLocError(e instanceof GeolocationPositionError
        ? "Location permission denied"
        : "Could not detect location");
    } finally {
      setLocLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = locSearch.trim();
    if (!q) return;
    setLocLoading(true);
    setLocError("");
    try {
      applyLocation(await searchLocation(q));
    } catch {
      setLocError("Location not found");
    } finally {
      setLocLoading(false);
    }
  };

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

  // ── Styles ────────────────────────────────────────────────────────────────

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

  const saveBtn: React.CSSProperties = { ...addBtn, color: C.accent };
  const cancelBtn: React.CSSProperties = { ...addBtn, color: C.textFaint };

  const ghostBtn: React.CSSProperties = {
    background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted,
    padding: "5px 10px", flexShrink: 0,
    opacity: locLoading ? 0.5 : 1,
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
            <span style={fieldLabel}>Time format</span>
            <div style={{ display: "flex", gap: 6 }}>
              {(["12h", "24h"] as const).map(fmt => (
                <button key={fmt} onClick={() => updateSettings({ timeFormat: fmt })} style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  border: `1px solid ${settings.timeFormat === fmt ? C.accent : C.border}`,
                  background: settings.timeFormat === fmt ? C.accentDim : C.surfaceHi,
                  color: settings.timeFormat === fmt ? C.accent : C.textMuted,
                }}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* ── Location ── */}
          <div style={sectionHead}>Location</div>

          {/* Current location display */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, flex: 1 }}>
              📍 {settings.location.label}
            </span>
            <button
              onClick={handleAutodetect}
              disabled={locLoading}
              style={ghostBtn}
              title="Use your current location"
            >
              {locLoading ? "…" : "autodetect"}
            </button>
          </div>

          {/* Search input */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input
              value={locSearch}
              onChange={e => setLocSearch(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
              placeholder="Search city (e.g. Dubai)"
              disabled={locLoading}
              style={{ ...inputStyle, flex: 1, opacity: locLoading ? 0.5 : 1 }}
            />
            <button onClick={handleSearch} disabled={locLoading} style={addBtn}>→</button>
          </div>

          {locError && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.red, marginBottom: 6 }}>
              {locError}
            </div>
          )}

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
                  <div key={f.url} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      placeholder="Label (e.g. TechCrunch)" style={{ ...inputStyle, marginBottom: 6 }} autoFocus />
                    <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      placeholder="https://example.com/rss" style={{ ...inputStyle, marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEdit} style={saveBtn}>save</button>
                      <button onClick={cancelEdit} style={cancelBtn}>cancel</button>
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
                    <button onClick={() => startEdit(f.url, f.label)} style={btnSmall} title="Edit">✎</button>
                    <button onClick={() => removeNewsFeed(f.url)} style={btnSmall} title="Remove">✕</button>
                  </div>
                )
              )}
            </div>
          )}

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
