"use client";

import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { sectionHead, fieldLabel } from "./styles";
import type { MapProjection } from "@/lib/types";

const PROJECTIONS: { key: MapProjection; label: string; desc: string }[] = [
  { key: "equirectangular", label: "Equirectangular", desc: "Simple flat grid" },
  { key: "naturalEarth",   label: "Natural Earth",   desc: "Smooth compromise" },
  { key: "mercator",       label: "Mercator",         desc: "Classic web map" },
  { key: "robinson",       label: "Robinson",         desc: "Rounded compromise" },
  { key: "winkel3",        label: "Winkel Tripel",    desc: "National Geographic" },
  { key: "mollweide",      label: "Mollweide",        desc: "Equal-area ellipse" },
  { key: "patterson",      label: "Patterson",        desc: "Modern, minimal distortion" },
];

export function TravelSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();

  return (
    <>
      <div style={sectionHead(C)}>Travel</div>
      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Map projection</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {PROJECTIONS.map(({ key, label, desc }) => {
            const active = global.travelProjection === key;
            return (
              <button
                key={key}
                onClick={() => updateGlobal({ travelProjection: key })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: `1px solid ${active ? C.accentMid : C.border}`,
                  background: active ? C.accentDim : C.surfaceHi,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: active ? C.accent : C.text,
                  fontWeight: active ? 600 : 400,
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: active ? C.accent : C.textFaint,
                }}>
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
