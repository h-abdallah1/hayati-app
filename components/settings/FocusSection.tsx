"use client";

import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { sectionHead, fieldLabel } from "./styles";

const WORK_PRESETS = [5, 10, 15, 25, 30, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

export function FocusSection() {
  const C = useTheme();
  const { panels, updatePanels } = usePanelSettings();

  const presetBtn = (val: number, active: boolean, onClick: () => void) => (
    <button key={val} onClick={onClick} style={{
      padding: "5px 0", borderRadius: 6, cursor: "pointer", flex: 1,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? C.accentDim : C.surfaceHi,
      color: active ? C.accent : C.textMuted,
    }}>
      {val}m
    </button>
  );

  return (
    <>
      <div style={sectionHead(C)}>Focus Timer</div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Work duration</span>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {WORK_PRESETS.map(v => presetBtn(v, panels.pomodoroWork === v, () => updatePanels({ pomodoroWork: v })))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Break duration</span>
        <div style={{ display: "flex", gap: 5 }}>
          {BREAK_PRESETS.map(v => presetBtn(v, panels.pomodoroBreak === v, () => updatePanels({ pomodoroBreak: v })))}
        </div>
      </div>
    </>
  );
}
