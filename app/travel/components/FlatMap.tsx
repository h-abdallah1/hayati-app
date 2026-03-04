"use client";

import { useState, useMemo } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import type { C_DARK } from "@/lib/design";

const W = 960;
const H = 500;

interface Props {
  countries: Feature<Geometry, { name: string }>[];
  visited: string[];
  onToggle: (id: string, name: string) => void;
  C: typeof C_DARK;
}

export function FlatMap({ countries, visited, onToggle, C }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  const { pathGen } = useMemo(() => {
    const projection = geoEquirectangular().scale(153).translate([W / 2, H / 2]);
    return { pathGen: geoPath().projection(projection) };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Countries */}
        {countries.map(geo => {
          const id = String(geo.id);
          const name = geo.properties?.name ?? id;
          const d = pathGen(geo) ?? "";
          const isVisited = visited.includes(id);
          const isHovered = hovered === id;
          return (
            <path
              key={id}
              d={d}
              fill={isVisited ? C.accent : isHovered ? C.borderHi : C.border}
              stroke="#000"
              strokeWidth={0.5}
              style={{ cursor: "pointer", transition: "fill 0.1s" }}
              onClick={() => onToggle(id, name)}
              onMouseEnter={e => {
                setHovered(id);
                setTooltip({ x: e.clientX, y: e.clientY, name });
              }}
              onMouseMove={e =>
                setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
              }
              onMouseLeave={() => {
                setHovered(null);
                setTooltip(null);
              }}
            />
          );
        })}
      </svg>

      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14,
          top: tooltip.y - 10,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 11,
          color: C.text,
          pointerEvents: "none",
          zIndex: 9999,
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}>
          {tooltip.name}
        </div>
      )}
    </div>
  );
}
