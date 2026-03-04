"use client";

import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { sectionHead } from "./styles";

const PANELS = [
  { id: "focus",   label: "Focus"       },
  { id: "tasks",   label: "Tasks"       },
  { id: "time",    label: "Time"        },
  { id: "news",    label: "News"        },
  { id: "quran",   label: "Quran Verse" },
  { id: "reading", label: "Reading"     },
  { id: "calendar",label: "Calendar"    },
  { id: "weather", label: "Weather"     },
  { id: "gym",     label: "Gym Tracker" },
  { id: "finance", label: "Finance"     },
  { id: "films",   label: "Films"       },
];

export function PanelsSection() {
  const C = useTheme();
  const { panels, updatePanels } = usePanelSettings();

  const toggle = (id: string) => {
    const hidden = panels.hiddenPanels.includes(id)
      ? panels.hiddenPanels.filter(p => p !== id)
      : [...panels.hiddenPanels, id];
    updatePanels({ hiddenPanels: hidden });
  };

  return (
    <>
      <div style={sectionHead(C)}>Panels</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {PANELS.map((p, i) => {
          const visible = !panels.hiddenPanels.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "none", border: "none", borderBottom: i < PANELS.length - 1 ? `1px solid ${C.border}` : "none",
                padding: "8px 0", cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: visible ? C.text : C.textFaint }}>
                {p.label}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: visible ? C.accent : C.textFaint }}>
                {visible ? "visible" : "hidden"}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
