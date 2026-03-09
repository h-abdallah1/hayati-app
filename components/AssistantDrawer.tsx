"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent } from "react";
import { Bot, X, RotateCcw, Square } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings, usePanelSettings } from "@/lib/settings";
import { useClock } from "@/lib/hooks/useClock";
import { useWeather } from "@/lib/hooks/useWeather";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { getPrayerTimes } from "@/lib/hooks/getPrayerTimes";
import { buildSystemPrompt } from "@/lib/ai-context";
import type { Goal, CalEventFull } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

interface GymData {
  streak: number;
  count: number;
  loggedToday: boolean;
}

export function AssistantDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const { panels } = usePanelSettings();
  const now = useClock();
  const weather = useWeather(global.location);
  const { events } = useCalendarEvents(panels.calendarFeeds);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [gymData, setGymData] = useState<GymData | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load goals from localStorage (SSR-safe)
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("hayati-goals");
      if (raw) setGoals(JSON.parse(raw) as Goal[]);
    } catch {}
  }, [open]);

  // Fetch gym data once when drawer opens
  useEffect(() => {
    if (!open || gymData) return;
    fetch("/api/hevy")
      .then(r => r.json())
      .then((d: GymData) => setGymData(d))
      .catch(() => {});
  }, [open, gymData]);

  // Abort stream when drawer closes
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  const prayers = getPrayerTimes(global.location, global.timeFormat, global.prayerMethod);
  const nowHour = now.getHours();
  const nowMins = nowHour * 60 + now.getMinutes();
  const nextPrayer = prayers.find(p => p.mins > nowMins) ?? null;

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const upcomingEvents = useMemo<CalEventFull[]>(() => {
    const limit = sevenDaysFromNow.toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    return events.filter(e => e.date >= today && e.date <= limit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, nowHour]);

  const activeGoals = useMemo(
    () => goals.filter(g => g.status === "active"),
    [goals]
  );

  const systemPrompt = useMemo(() => buildSystemPrompt({
    userName: global.name,
    locationLabel: global.location.label,
    currentDate: now.toLocaleDateString("en-CA"),
    currentTime: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: global.timeFormat === "12h" }),
    prayers,
    nextPrayer,
    weather,
    upcomingEvents,
    activeGoals,
    gymStreak: gymData?.streak ?? 0,
    gymSessionsThisYear: gymData?.count ?? 0,
    gymLoggedToday: gymData?.loggedToday ?? false,
  }), // eslint-disable-next-line react-hooks/exhaustive-deps
  [nowHour, weather.temp, weather.condition, upcomingEvents.length, activeGoals.length, gymData]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError(null);

    const userMsg: Msg = { role: "user", content: text };
    const assistantMsg: Msg = { role: "assistant", content: "" };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: text },
    ];

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          model: global.ollamaModel,
          ollamaUrl: global.ollamaUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed);
            if (chunk.error) throw new Error(chunk.error);
            if (chunk.token) {
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: next[next.length - 1].content + chunk.token,
                };
                return next;
              });
            }
          } catch (e) {
            if (e instanceof Error && !e.message.includes("JSON")) throw e;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // keep partial response
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], error: true };
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError(null);
    setStreaming(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape") onClose();
  };

  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 380,
        background: C.bg,
        borderLeft: `1px solid ${C.border}`,
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <Bot size={15} color={C.accent} strokeWidth={2} />
          <span style={{ ...mono, fontSize: 11, color: C.accent, fontWeight: 600, flex: 1 }}>
            {global.ollamaModel}
          </span>
          <button
            onClick={newChat}
            title="New chat"
            style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
              cursor: "pointer", padding: "3px 7px",
              ...mono, fontSize: 9, color: C.textFaint,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <RotateCcw size={10} strokeWidth={1.7} />
            new chat
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.textFaint, padding: 4, display: "flex",
            }}
          >
            <X size={14} strokeWidth={1.7} />
          </button>
        </div>

        {/* Message thread */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 8, paddingTop: 60,
            }}>
              <Bot size={28} color={C.borderHi} strokeWidth={1.5} />
              <span style={{ ...mono, fontSize: 10, color: C.textFaint, textAlign: "center", lineHeight: 1.7 }}>
                Ask me anything about your day —{"\n"}
                prayers, weather, events, goals, gym.
              </span>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const isLast = i === messages.length - 1;
            const showCursor = isLast && streaming && !isUser;

            return (
              <div key={i} style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "88%",
                  padding: "8px 12px",
                  borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                  background: isUser ? C.accentDim : C.surfaceHi,
                  border: `1px solid ${isUser ? C.accentMid : C.border}`,
                  color: msg.error ? C.red : C.text,
                  ...mono, fontSize: 12, lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content || (showCursor ? "" : <span style={{ color: C.textFaint }}>…</span>)}
                  {showCursor && <span style={{ color: C.accent }}>▋</span>}
                </div>
              </div>
            );
          })}

          {error && (
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: `${C.red}18`,
              border: `1px solid ${C.red}44`,
              ...mono, fontSize: 11, color: C.red, lineHeight: 1.6,
            }}>
              {error}
              {error.includes("Cannot reach Ollama") && (
                <div style={{ marginTop: 4, color: C.textFaint, fontSize: 10 }}>
                  Run: <code>ollama serve</code>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "12px 12px 16px",
          borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 8, alignItems: "flex-end",
          flexShrink: 0,
        }}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something… (Enter to send, Shift+Enter for newline)"
            style={{
              flex: 1, resize: "none",
              background: C.surfaceHi,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "8px 10px",
              ...mono, fontSize: 11, color: C.text,
              outline: "none", lineHeight: 1.6,
            }}
          />
          {streaming ? (
            <button
              onClick={stop}
              title="Stop"
              style={{
                background: `${C.red}22`,
                border: `1px solid ${C.red}55`,
                borderRadius: 7, cursor: "pointer",
                padding: "8px 10px", color: C.red,
                display: "flex", alignItems: "center",
              }}
            >
              <Square size={14} strokeWidth={2} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              title="Send"
              style={{
                background: input.trim() ? C.accentDim : "none",
                border: `1px solid ${input.trim() ? C.accent : C.border}`,
                borderRadius: 7, cursor: input.trim() ? "pointer" : "default",
                padding: "8px 10px",
                color: input.trim() ? C.accent : C.textFaint,
                ...mono, fontSize: 11,
                display: "flex", alignItems: "center",
              }}
            >
              ↑
            </button>
          )}
        </div>
      </div>
    </>
  );
}
