"use client";

import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLayout } from "@/lib/layout";
import { MODULES } from "@/lib/modules";
import { sectionHead, ghostBtn } from "./styles";

export function ModulesSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const { resetLayout } = useLayout();

  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const orderedIds = global.moduleOrder.length
    ? global.moduleOrder
    : MODULES.map(m => m.id);
  const ordered = orderedIds.map(id => MODULES.find(m => m.id === id)!).filter(Boolean);

  const toggle = (id: string) => {
    const next = global.disabledModules.includes(id)
      ? global.disabledModules.filter(m => m !== id)
      : [...global.disabledModules, id];
    updateGlobal({ disabledModules: next });
  };

  const onDragStart = (id: string) => {
    dragId.current = id;
  };

  const onDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragId.current !== targetId) setDragOver(targetId);
  };

  const onDrop = (targetId: string) => {
    const from = dragId.current;
    if (!from || from === targetId) return;
    const ids = [...orderedIds];
    const fromIdx = ids.indexOf(from);
    const toIdx = ids.indexOf(targetId);
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, from);
    updateGlobal({ moduleOrder: ids });
  };

  const onDragEnd = () => {
    dragId.current = null;
    setDragOver(null);
  };

  return (
    <>
      <div style={sectionHead(C)}>Modules</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ordered.map((mod, i) => {
          const enabled = !global.disabledModules.includes(mod.id);
          return (
            <div
              key={mod.id}
              draggable
              onDragStart={() => onDragStart(mod.id)}
              onDragOver={e => onDragOver(e, mod.id)}
              onDrop={() => onDrop(mod.id)}
              onDragEnd={onDragEnd}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                borderBottom: i < ordered.length - 1 ? `1px solid ${C.border}` : "none",
                borderTop: dragOver === mod.id ? `2px solid ${C.accent}` : "2px solid transparent",
                padding: "7px 0",
                cursor: "default",
              }}
            >
              <GripVertical
                size={12}
                color={C.textFaint}
                style={{ flexShrink: 0, cursor: "grab" }}
              />
              <mod.icon size={13} strokeWidth={1.7} color={enabled ? C.textMuted : C.textFaint} style={{ flexShrink: 0 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: enabled ? C.text : C.textFaint }}>
                  {mod.label}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {mod.description}
                </span>
              </div>
              <button
                onClick={() => toggle(mod.id)}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9, flexShrink: 0,
                  color: enabled ? C.accent : C.textFaint,
                }}
              >
                {enabled ? "on" : "off"}
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={resetLayout} style={{ ...ghostBtn(C, false), marginTop: 14, width: "100%", textAlign: "center" }}>
        reset layout
      </button>
    </>
  );
}
