"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect, useState } from "react";
import { useThemeToggle } from "@/lib/theme";
import type { Feature, Geometry } from "geojson";
import type { C_DARK } from "@/lib/design";

import type GlobeType from "react-globe.gl";
type GlobeProps = React.ComponentProps<typeof GlobeType>;

const Globe = dynamic<GlobeProps>(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%",
      height: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      loading…
    </div>
  ),
});

interface Props {
  countries: Feature<Geometry, { name: string }>[];
  visited: string[];
  onToggle: (id: string, name: string) => void;
  C: typeof C_DARK;
}

export function GlobeView({ countries, visited, onToggle, C }: Props) {
  const { isDark } = useThemeToggle();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const globeImg = isDark
    ? "//unpkg.com/three-globe/example/img/earth-dark.jpg"
    : "//unpkg.com/three-globe/example/img/earth-day.jpg";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capColor = (d: any) => {
    const id = String(d.id);
    return visited.includes(id)
      ? C.accent
      : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (polygon: any) => {
    onToggle(String(polygon.id), polygon.properties?.name ?? String(polygon.id));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (d: any) =>
    `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:${C.text};background:${C.surface};padding:3px 8px;border-radius:4px;border:1px solid ${C.border}">${d.properties?.name ?? ""}</span>`;

  return (
    <div ref={containerRef} style={{ width: "100%", height: 500, overflow: "hidden" }}>
      <Globe
        width={width}
        height={500}
        globeImageUrl={globeImg}
        backgroundColor="rgba(0,0,0,0)"
        polygonsData={countries}
        polygonCapColor={capColor}
        polygonSideColor={() => "rgba(0,0,0,0)"}
        polygonStrokeColor={() => C.border}
        polygonAltitude={0.006}
        polygonLabel={label}
        onPolygonClick={handleClick}
        showAtmosphere
        atmosphereColor={C.accent}
        atmosphereAltitude={0.12}
      />
    </div>
  );
}
