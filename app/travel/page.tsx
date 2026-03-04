"use client";

import { useState, useEffect } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { useTheme } from "@/lib/theme";
import { FlatMap } from "./components/FlatMap";
import { GlobeView } from "./components/GlobeView";
import { Map, Globe } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const STORAGE_KEY = "hayati-visited-countries";

type View = "flat" | "globe";

export default function TravelPage() {
  const C = useTheme();
  const [visited, setVisited] = useState<string[]>([]);
  const [countries, setCountries] = useState<Feature<Geometry, { name: string }>[]>([]);
  const [view, setView] = useState<View>("flat");

  // Load geo data
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then((world: Topology) => {
        const fc = feature(
          world,
          world.objects.countries as GeometryCollection<{ name: string }>
        );
        setCountries(fc.features);
      });
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setVisited(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
    } catch {}
  }, [visited]);

  function toggle(id: string) {
    setVisited(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  function remove(id: string) {
    setVisited(prev => prev.filter(c => c !== id));
  }

  // Build id→name map from loaded countries
  const nameOf = (id: string) =>
    countries.find(f => String(f.id) === id)?.properties?.name ?? id;

  const visitedSorted = [...visited]
    .map(id => ({ id, name: nameOf(id) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{
      padding: "28px 32px",
      maxWidth: 1100,
      margin: "0 auto",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
            TRAVEL
          </span>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {visited.length} countr{visited.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* View toggle */}
        <div style={{
          display: "flex",
          gap: 3,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 3,
        }}>
          {([
            { v: "flat" as View, Icon: Map, label: "Map" },
            { v: "globe" as View, Icon: Globe, label: "Globe" },
          ]).map(({ v, Icon, label }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid ${view === v ? C.accentMid : "transparent"}`,
                background: view === v ? C.accentDim : "transparent",
                color: view === v ? C.accent : C.textMuted,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: view === v ? 600 : 400,
              }}
            >
              <Icon size={12} strokeWidth={view === v ? 2.2 : 1.7} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 20 }} />

      {/* Map / Globe */}
      <div>
        {view === "flat" ? (
          <FlatMap countries={countries} visited={visited} onToggle={toggle} C={C} />
        ) : (
          <GlobeView countries={countries} visited={visited} onToggle={toggle} C={C} />
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, margin: "20px 0" }} />

      {/* Visited chips */}
      {visitedSorted.length === 0 ? (
        <p style={{ fontSize: 12, color: C.textFaint, fontStyle: "italic", margin: 0 }}>
          Click any country on the map to mark it as visited.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {visitedSorted.map(({ id, name }) => (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 20,
                background: C.accentDim,
                border: `1px solid ${C.accentMid}`,
                fontSize: 11,
                color: C.accent,
              }}
            >
              <span>{name}</span>
              <button
                onClick={() => remove(id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: C.accent,
                  fontSize: 14,
                  lineHeight: 1,
                  opacity: 0.7,
                  display: "flex",
                  alignItems: "center",
                }}
                title={`Remove ${name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
