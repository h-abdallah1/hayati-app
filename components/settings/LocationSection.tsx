"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import type { LocationCoords } from "@/lib/types";
import { detectLocation, searchLocation } from "@/lib/location";
import { inputStyle, sectionHead, addBtn, ghostBtn } from "./styles";

interface Props {
  open: boolean;
}

export function LocationSection({ open }: Props) {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const [locSearch, setLocSearch] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    if (open) {
      setLocSearch("");
      setLocError("");
    }
  }, [open]);

  const applyLocation = (loc: LocationCoords) => {
    updateGlobal({ location: loc });
    setLocSearch("");
    setLocError("");
  };

  const handleAutodetect = async () => {
    setLocLoading(true);
    setLocError("");
    try {
      applyLocation(await detectLocation());
    } catch (e) {
      setLocError(e instanceof GeolocationPositionError
        ? "Location permission denied"
        : "Could not detect location");
    } finally {
      setLocLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = locSearch.trim();
    if (!q) return;
    setLocLoading(true);
    setLocError("");
    try {
      applyLocation(await searchLocation(q));
    } catch {
      setLocError("Location not found");
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <>
      <div style={sectionHead(C)}>Location</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, flex: 1 }}>
          📍 {global.location.label}
        </span>
        <button
          onClick={handleAutodetect}
          disabled={locLoading}
          style={ghostBtn(C, locLoading)}
          title="Use your current location"
        >
          {locLoading ? "…" : "autodetect"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input
          value={locSearch}
          onChange={e => setLocSearch(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
          placeholder="Search city (e.g. Dubai)"
          disabled={locLoading}
          style={{ ...inputStyle(C), flex: 1, opacity: locLoading ? 0.5 : 1 }}
        />
        <button onClick={handleSearch} disabled={locLoading} style={addBtn(C)}>→</button>
      </div>

      {locError && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.red, marginBottom: 6 }}>
          {locError}
        </div>
      )}
    </>
  );
}
