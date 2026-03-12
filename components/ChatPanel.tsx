"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent } from "react";
import { Bot, RotateCcw, Square } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings, usePanelSettings } from "@/lib/settings";
import { useClock } from "@/lib/hooks/useClock";
import { useWeather } from "@/lib/hooks/useWeather";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { getPrayerTimes } from "@/lib/hooks/getPrayerTimes";
import { useQuranVerse } from "@/lib/hooks/useQuranVerse";
import { useLetterboxd } from "@/lib/hooks/useLetterboxd";
import { useGithub } from "@/lib/hooks/useGithub";
import { buildSystemPrompt } from "@/lib/ai-context";
import type { Goal, CalEventFull, GithubDay } from "@/lib/types";
import { loadBooks } from "@/lib/bookList";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean; timestamp: string };

interface GymData {
  streak: number;
  count: number;
  loggedToday: boolean;
  lastWorkout: { title: string; date: string; duration: number } | null;
}

function renderInline(text: string, C: Record<string, string>, mono: React.CSSProperties): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const tok = match[0];
    if (tok.startsWith("`")) {
      parts.push(
        <code key={key++} style={{ background: C.surfaceHi, borderRadius: 3, padding: "1px 4px", ...mono, fontSize: 11 }}>
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**")) {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = match.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string, C: Record<string, string>, mono: React.CSSProperties): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={key++} style={{
          background: C.surface, borderRadius: 6, padding: "8px 10px",
          overflowX: "auto", margin: "4px 0", ...mono, fontSize: 11, lineHeight: 1.6,
          whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {codeLines.join("\n")}
        </pre>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(<div key={key++} style={{ fontWeight: 700, fontSize: 12, margin: "4px 0 2px" }}>{renderInline(line.slice(4), C, mono)}</div>);
    } else if (line.startsWith("## ")) {
      nodes.push(<div key={key++} style={{ fontWeight: 700, fontSize: 13, margin: "5px 0 2px" }}>{renderInline(line.slice(3), C, mono)}</div>);
    } else if (line.startsWith("# ")) {
      nodes.push(<div key={key++} style={{ fontWeight: 700, fontSize: 14, margin: "6px 0 2px" }}>{renderInline(line.slice(2), C, mono)}</div>);
    } else if (line.startsWith("> ")) {
      nodes.push(
        <div key={key++} style={{ borderLeft: `2px solid ${C.borderHi}`, paddingLeft: 8, color: C.textMuted, margin: "2px 0", fontStyle: "italic" }}>
          {renderInline(line.slice(2), C, mono)}
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <div key={key++} style={{ display: "flex", gap: 6, margin: "1px 0" }}>
          <span style={{ color: C.textMuted, flexShrink: 0 }}>·</span>
          <span>{renderInline(line.slice(2), C, mono)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={key++} style={{ height: 6 }} />);
    } else {
      nodes.push(<div key={key++}>{renderInline(line, C, mono)}</div>);
    }
    i++;
  }
  return nodes;
}

function calcGithubStreak(days: GithubDay[]): number {
  const set = new Set(days.filter(d => d.count > 0).map(d => d.date));
  let streak = 0;
  const d = new Date();
  while (set.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

interface ChatPanelProps {
  /** Extra buttons rendered in the header (e.g. expand-to-page, close) */
  headerActions?: React.ReactNode;
  /** When false, data loading and streaming are paused (drawer closed) */
  active?: boolean;
  /** Max width of the message column — defaults to "100%" */
  maxWidth?: number | string;
  /** Input textarea rows */
  inputRows?: number;
}

export function ChatPanel({ headerActions, active = true, maxWidth = "100%", inputRows = 3 }: ChatPanelProps) {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const { panels } = usePanelSettings();
  const now = useClock();
  const weather = useWeather(global.location);
  const { events } = useCalendarEvents(panels.calendarFeeds);
  const quranVerse = useQuranVerse();
  const { films } = useLetterboxd(global.letterboxdUsername);
  const { days: githubDays, total: githubTotal } = useGithub(global.githubUsername, global.githubToken);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [gymData, setGymData] = useState<GymData | null>(null);
  const [currentBook, setCurrentBook] = useState<{ title: string; author: string; progress: number } | null>(null);
  const [books, setBooks] = useState<{ title: string; author?: string; finishedDate: string }[]>([]);
  const [visitedCount, setVisitedCount] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!active) return;
    try {
      const raw = localStorage.getItem("hayati-goals");
      if (raw) setGoals(JSON.parse(raw) as Goal[]);
      const cbRaw = localStorage.getItem("hayati-current-book");
      if (cbRaw) setCurrentBook(JSON.parse(cbRaw));
      const bookEntries = loadBooks().filter(b => b.finishedDate);
      setBooks(bookEntries.map(b => ({ title: b.title, author: b.author || undefined, finishedDate: b.finishedDate! })));
      const tcRaw = localStorage.getItem("hayati-visited-countries");
      if (tcRaw) setVisitedCount((JSON.parse(tcRaw) as unknown[]).length);
    } catch {}
  }, [active]);

  useEffect(() => {
    if (!active || gymData) return;
    fetch("/api/hevy").then(r => r.json()).then((d: GymData) => setGymData(d)).catch(() => {});
  }, [active, gymData]);

  useEffect(() => {
    if (!active) abortRef.current?.abort();
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (active) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [active]);

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

  const currentYear = new Date().getFullYear();
  const activeGoals = useMemo(() => goals.filter(g => g.status === "active"), [goals]);
  const doneGoalsThisYear = useMemo(
    () => goals.filter(g => g.status === "done" && g.year === currentYear),
    [goals, currentYear]
  );

  const systemPrompt = useMemo(() => buildSystemPrompt({
    userName: global.name,
    locationLabel: global.location.label,
    currentDate: now.toLocaleDateString("en-CA"),
    currentTime: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: global.timeFormat === "12h" }),
    prayers, nextPrayer, weather, upcomingEvents, activeGoals, doneGoalsThisYear,
    gymStreak: gymData?.streak ?? 0,
    gymSessionsThisYear: gymData?.count ?? 0,
    gymLoggedToday: gymData?.loggedToday ?? false,
    lastWorkout: gymData?.lastWorkout ?? null,
    currentBook,
    recentBooks: books.slice(-5).reverse(),
    recentFilms: films.slice(0, 5).map(f => ({ title: f.title, year: f.year, rating: f.rating, watchedDate: f.watchedDate })),
    githubContributionsTotal: githubTotal,
    githubStreak: calcGithubStreak(githubDays),
    quranVerse: quranVerse ? { translation: quranVerse.translation, ref: quranVerse.ref } : null,
    visitedCountriesCount: visitedCount,
  }), // eslint-disable-next-line react-hooks/exhaustive-deps
  [nowHour, weather.temp, weather.condition, upcomingEvents.length, activeGoals.length, doneGoalsThisYear.length,
   gymData, quranVerse?.ref, films.length, githubTotal, visitedCount, currentBook?.progress, books.length]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError(null);

    const ts = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const userMsg: Msg = { role: "user", content: text, timestamp: ts };
    const assistantMsg: Msg = { role: "assistant", content: "", timestamp: ts };

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
        body: JSON.stringify({ messages: apiMessages, model: global.ollamaModel, ollamaUrl: global.ollamaUrl }),
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
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + chunk.token };
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

  function stop() { abortRef.current?.abort(); }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError(null);
    setStreaming(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
        {headerActions}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{
          flex: 1, maxWidth, width: "100%", margin: "0 auto",
          padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12,
          boxSizing: "border-box",
        }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 60 }}>
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
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "88%", padding: "8px 12px",
                  borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                  background: isUser ? C.accentDim : C.surfaceHi,
                  border: `1px solid ${isUser ? C.accentMid : C.border}`,
                  color: msg.error ? C.red : C.text,
                  ...mono, fontSize: 12, lineHeight: 1.65, wordBreak: "break-word",
                }}>
                  {isUser ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                  ) : (
                    <>
                      {msg.content
                        ? renderMarkdown(msg.content, C as Record<string, string>, mono)
                        : (showCursor ? null : <span style={{ color: C.textFaint }}>…</span>)
                      }
                      {showCursor && <span style={{ color: C.accent }}>▋</span>}
                    </>
                  )}
                </div>
                <div style={{ fontSize: 9, color: C.textFaint, marginTop: 3, ...mono }}>{msg.timestamp}</div>
              </div>
            );
          })}

          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: `${C.red}18`, border: `1px solid ${C.red}44`,
              ...mono, fontSize: 11, color: C.red, lineHeight: 1.6,
            }}>
              {error}
              {error.includes("Cannot reach Ollama") && (
                <div style={{ marginTop: 4, color: C.textFaint, fontSize: 10 }}>Run: <code>ollama serve</code></div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 12px 16px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0,
        maxWidth, width: "100%", margin: "0 auto", boxSizing: "border-box",
      }}>
        <textarea
          ref={textareaRef}
          rows={inputRows}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something… (Enter to send, Shift+Enter for newline)"
          style={{
            flex: 1, resize: "none",
            background: C.surfaceHi, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 10px",
            ...mono, fontSize: 11, color: C.text, outline: "none", lineHeight: 1.6,
          }}
        />
        {streaming ? (
          <button onClick={stop} title="Stop" style={{ background: `${C.red}22`, border: `1px solid ${C.red}55`, borderRadius: 7, cursor: "pointer", padding: "8px 10px", color: C.red, display: "flex", alignItems: "center" }}>
            <Square size={14} strokeWidth={2} fill="currentColor" />
          </button>
        ) : (
          <button onClick={send} disabled={!input.trim()} title="Send" style={{ background: input.trim() ? C.accentDim : "none", border: `1px solid ${input.trim() ? C.accent : C.border}`, borderRadius: 7, cursor: input.trim() ? "pointer" : "default", padding: "8px 10px", color: input.trim() ? C.accent : C.textFaint, ...mono, fontSize: 11, display: "flex", alignItems: "center" }}>
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
