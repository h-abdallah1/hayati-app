"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { inputStyle, fieldLabel, sectionHead, addBtn } from "./styles";
import type { SmsConfig } from "@/lib/types";

interface Props {
  open: boolean;
}

export function GeneralSection({ open }: Props) {
  const C = useTheme();
  const { isDark, toggle } = useThemeToggle();
  const { global, updateGlobal } = useGlobalSettings();
  const [nameVal, setNameVal] = useState(global.name);
  const [lbVal, setLbVal] = useState(global.letterboxdUsername ?? "");
  const [vaultVal, setVaultVal] = useState(global.obsidianVaultPath ?? "");
  const [sendersVal, setSendersVal] = useState((global.smsConfig?.senders ?? []).join("\n"));

  useEffect(() => {
    if (open) {
      setNameVal(global.name);
      setLbVal(global.letterboxdUsername ?? "");
      setVaultVal(global.obsidianVaultPath ?? "");
      setSendersVal((global.smsConfig?.senders ?? []).join("\n"));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveName = () => { const v = nameVal.trim(); if (v) updateGlobal({ name: v }); };
  const saveLb = () => { updateGlobal({ letterboxdUsername: lbVal.trim() }); };
  const saveVault = () => { updateGlobal({ obsidianVaultPath: vaultVal.trim() }); };
  const saveSenders = () => {
    const senders = sendersVal.split("\n").map(s => s.trim()).filter(Boolean);
    updateGlobal({ smsConfig: { ...(global.smsConfig ?? { enabled: false }), senders } });
  };
  const toggleSms = () => {
    updateGlobal({ smsConfig: { ...(global.smsConfig ?? { senders: [] }), enabled: !global.smsConfig?.enabled } });
  };

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
        <span style={fieldLabel(C)}>Obsidian vault path</span>
        <input
          value={vaultVal}
          onChange={e => setVaultVal(e.target.value)}
          onBlur={saveVault}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && saveVault()}
          placeholder="/Users/you/Documents/MyVault"
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

      {/* Finance */}
      <div style={sectionHead(C)}>Finance</div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Payment day of month</span>
        <input
          type="number"
          min={1}
          max={28}
          value={global.paymentDay ?? 1}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1 && v <= 28) updateGlobal({ paymentDay: v });
          }}
          style={{ ...inputStyle(C), width: 60 }}
        />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 4 }}>
          Day you receive your salary (1–28). Months on the finance page will run from this day.
        </div>
      </div>

      {/* SMS Import */}
      <div style={sectionHead(C)}>SMS Import</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={fieldLabel(C)}>Import from Mac Messages</span>
          <button onClick={toggleSms} style={{
            background: global.smsConfig?.enabled ? C.accentDim : "none",
            border: `1px solid ${global.smsConfig?.enabled ? C.accent : C.border}`,
            borderRadius: 5, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: global.smsConfig?.enabled ? C.accent : C.textFaint,
            padding: "3px 10px", letterSpacing: "0.3px",
          }}>
            {global.smsConfig?.enabled ? "on" : "off"}
          </button>
        </div>
        <span style={fieldLabel(C)}>Bank sender names / numbers (one per line)</span>
        <textarea
          value={sendersVal}
          onChange={e => setSendersVal(e.target.value)}
          onBlur={saveSenders}
          placeholder={"ENBD\nFAB\nADCB\n+97150xxxxxxx"}
          rows={4}
          style={{
            ...inputStyle(C),
            resize: "vertical",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            lineHeight: 1.6,
          }}
        />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 5, lineHeight: 1.6 }}>
          Requires: iPhone → Mac SMS forwarding on, and Full Disk Access for Terminal in System Settings → Privacy &amp; Security.
        </div>
      </div>
    </>
  );
}
