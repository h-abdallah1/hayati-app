"use client";

import { useState, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
import { useSettings } from "@/lib/settings";
import { inputStyle, sectionHead, btnSmall, addBtn } from "./styles";

export function CalendarSection() {
  const C = useTheme();
  const { settings, updateSettings } = useSettings();
  const [calFeedInput, setCalFeedInput] = useState("");

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

  return (
    <>
      <div style={sectionHead(C)}>Calendar ICS Feeds</div>

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
              <button onClick={() => removeCalFeed(url)} style={btnSmall(C)} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input value={calFeedInput} onChange={e => setCalFeedInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addCalFeed()}
          placeholder="https://calendar.google.com/…" style={{ ...inputStyle(C), flex: 1 }} />
        <button onClick={addCalFeed} style={addBtn(C)}>add</button>
      </div>
    </>
  );
}
