"use client";

import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLayout } from "@/lib/layout";
import { MODULES } from "@/lib/modules";
import { sectionHead, ghostBtn } from "./styles";

export function ModulesSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const { resetLayout } = useLayout();

  const toggle = (id: string) => {
    const next = global.disabledModules.includes(id)
      ? global.disabledModules.filter(m => m !== id)
      : [...global.disabledModules, id];
    updateGlobal({ disabledModules: next });
  };

  return (
    <>
      <div style={sectionHead(C)}>Modules</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {MODULES.map((mod, i) => {
          const enabled = !global.disabledModules.includes(mod.id);
          return (
            <button
              key={mod.id}
              onClick={() => toggle(mod.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "none", border: "none",
                borderBottom: i < MODULES.length - 1 ? `1px solid ${C.border}` : "none",
                padding: "9px 0", cursor: "pointer", textAlign: "left", gap: 10,
              }}
            >
              <mod.icon size={13} strokeWidth={1.7} color={enabled ? C.textMuted : C.textFaint} style={{ flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: enabled ? C.text : C.textFaint }}>
                  {mod.label}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mod.description}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, flexShrink: 0,
                color: enabled ? C.accent : C.textFaint,
              }}>
                {enabled ? "on" : "off"}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={resetLayout} style={{ ...ghostBtn(C, false), marginTop: 14, width: "100%", textAlign: "center" }}>
        reset layout
      </button>
    </>
  );
}
