"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { inputStyle, fieldLabel, sectionHead, addBtn } from "./styles";

interface Props {
  open: boolean;
}

export function GeneralSection({ open }: Props) {
  const C = useTheme();
  const { isDark, toggle } = useThemeToggle();
  const { global, updateGlobal } = useGlobalSettings();
  const [nameVal, setNameVal] = useState(global.name);
  const [lbVal, setLbVal] = useState(global.letterboxdUsername ?? "");

  useEffect(() => {
    if (open) {
      setNameVal(global.name);
      setLbVal(global.letterboxdUsername ?? "");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = () => { const v = nameVal.trim(); if (v) updateGlobal({ name: v }); };
  const saveLb = () => { updateGlobal({ letterboxdUsername: lbVal.trim() }); };

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
        <span style={fieldLabel(C)}>Letterboxd username</span>
        <input
          value={lbVal}
          onChange={e => setLbVal(e.target.value)}
          onBlur={saveLb}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveLb()}
          placeholder="username"
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
    </>
  );
}
