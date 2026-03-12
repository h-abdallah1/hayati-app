"use client";

import { useState, KeyboardEvent } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { ACCENT_THEMES } from "@/lib/design";
import { inputStyle, fieldLabel, sectionHead } from "./styles";

export function GeneralSection() {
  const C = useTheme();
  const { isDark, toggle } = useThemeToggle();
  const { global, updateGlobal } = useGlobalSettings();
  const [nameVal, setNameVal] = useState(global.name);
  const [githubUser, setGithubUser] = useState(global.githubUsername);
  const [githubTok, setGithubTok] = useState(global.githubToken);
  const [ollamaUrl, setOllamaUrl] = useState(global.ollamaUrl);
  const [ollamaModel, setOllamaModel] = useState(global.ollamaModel);

  const saveName = () => { const v = nameVal.trim(); if (v) updateGlobal({ name: v }); };
  const saveGithubUser  = () => updateGlobal({ githubUsername: githubUser.trim() });
  const saveGithubTok   = () => updateGlobal({ githubToken: githubTok.trim() });
  const saveOllamaUrl   = () => { const v = ollamaUrl.trim(); if (v) updateGlobal({ ollamaUrl: v }); };
  const saveOllamaModel = () => { const v = ollamaModel.trim(); if (v) updateGlobal({ ollamaModel: v }); };

  return (
    <>
      <div style={sectionHead(C)}>General</div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Display name</span>
        <input
          value={nameVal}
          onChange={e => setNameVal(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveName()}
          style={inputStyle(C)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Appearance</span>
        <div style={{ display: "flex", gap: 6 }}>
          {([["Light", false], ["Dark", true]] as const).map(([label, dark]) => (
            <button key={label} onClick={() => { if (isDark !== dark) toggle(); }} style={{
              flex: 1, padding: "6px 0", borderRadius: 6, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              border: `1px solid ${isDark === dark ? C.accent : C.border}`,
              background: isDark === dark ? C.accentDim : C.surfaceHi,
              color: isDark === dark ? C.accent : C.textMuted,
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Accent</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 4 }}>
          {ACCENT_THEMES.map(theme => {
            const color = isDark ? theme.dark : theme.light;
            const active = global.accentTheme === theme.name;
            return (
              <button
                key={theme.name}
                title={theme.label}
                onClick={() => updateGlobal({ accentTheme: theme.name })}
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: color,
                  border: active ? `2px solid ${C.text}` : `2px solid transparent`,
                  outline: active ? `2px solid ${color}` : "none",
                  outlineOffset: 1,
                  cursor: "pointer", padding: 0, flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Time format</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["12h", "24h"] as const).map(fmt => (
            <button key={fmt} onClick={() => updateGlobal({ timeFormat: fmt })} style={{
              flex: 1, padding: "6px 0", borderRadius: 6, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              border: `1px solid ${global.timeFormat === fmt ? C.accent : C.border}`,
              background: global.timeFormat === fmt ? C.accentDim : C.surfaceHi,
              color: global.timeFormat === fmt ? C.accent : C.textMuted,
            }}>
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={fieldLabel(C)}>Ticker bar</span>
          <button onClick={() => updateGlobal({ showTicker: !global.showTicker })} style={{
            background: global.showTicker ? C.accentDim : "none",
            border: `1px solid ${global.showTicker ? C.accent : C.border}`,
            borderRadius: 5, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: global.showTicker ? C.accent : C.textFaint,
            padding: "3px 10px", letterSpacing: "0.3px",
          }}>
            {global.showTicker ? "on" : "off"}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 20, marginBottom: 6 }}>
        <span style={sectionHead(C)}>GitHub</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Username</span>
        <input
          value={githubUser}
          onChange={e => setGithubUser(e.target.value)}
          onBlur={saveGithubUser}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveGithubUser()}
          placeholder="e.g. torvalds"
          style={inputStyle(C)}
        />
      </div>

      <div style={{ marginBottom: 4 }}>
        <span style={fieldLabel(C)}>Personal access token</span>
        <input
          type="password"
          value={githubTok}
          onChange={e => setGithubTok(e.target.value)}
          onBlur={saveGithubTok}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveGithubTok()}
          placeholder="ghp_..."
          style={inputStyle(C)}
        />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        Generate at github.com/settings/tokens (read:user scope)
      </div>

      <div style={{ marginTop: 20, marginBottom: 6 }}>
        <span style={sectionHead(C)}>Local AI (Ollama)</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Ollama URL</span>
        <input
          value={ollamaUrl}
          onChange={e => setOllamaUrl(e.target.value)}
          onBlur={saveOllamaUrl}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveOllamaUrl()}
          placeholder="http://localhost:11434"
          style={inputStyle(C)}
        />
      </div>

      <div style={{ marginBottom: 4 }}>
        <span style={fieldLabel(C)}>Model name</span>
        <input
          value={ollamaModel}
          onChange={e => setOllamaModel(e.target.value)}
          onBlur={saveOllamaModel}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveOllamaModel()}
          placeholder="llama3.2:1b"
          style={inputStyle(C)}
        />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        Run locally with: ollama pull {ollamaModel || "llama3.2"}
      </div>
    </>
  );
}
