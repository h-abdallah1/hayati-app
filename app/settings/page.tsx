"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { GeneralSection } from "@/components/settings/GeneralSection";
import { ModulesSection } from "@/components/settings/ModulesSection";
import { LocationSection } from "@/components/settings/LocationSection";
import { NewsFeedsSection } from "@/components/settings/NewsFeedsSection";
import { CalendarSection } from "@/components/settings/CalendarSection";
import { TravelSection } from "@/components/settings/TravelSection";
import { inputStyle, fieldLabel, sectionHead } from "@/components/settings/styles";

function isEnabled(disabledModules: string[], id: string) {
  return !disabledModules.includes(id);
}

function FilmsSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const [lbVal, setLbVal] = useState(global.letterboxdUsername ?? "");
  const saveLb = () => updateGlobal({ letterboxdUsername: lbVal.trim() });

  return (
    <>
      <div style={sectionHead(C)}>Films</div>
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
    </>
  );
}


function NotesSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const [vaultVal, setVaultVal] = useState(global.obsidianVaultPath ?? "");
  const saveVault = () => updateGlobal({ obsidianVaultPath: vaultVal.trim() });

  return (
    <>
      <div style={sectionHead(C)}>Notes</div>
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
    </>
  );
}

const ALL_TABS = [
  { id: "general", label: "General", moduleId: null },
  { id: "location", label: "Location", moduleId: null },
  { id: "news", label: "News", moduleId: "news" },
  { id: "calendar", label: "Calendar", moduleId: "calendar" },
  { id: "travel", label: "Travel", moduleId: "travel" },
  { id: "films", label: "Films", moduleId: "films" },
  { id: "notes", label: "Notes", moduleId: "notes" },
] as const;

export default function SettingsPage() {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const { global } = useGlobalSettings();
  const disabled = global.disabledModules;
  const [activeTab, setActiveTab] = useState("general");

  const visibleTabs = ALL_TABS.filter(t => !t.moduleId || isEnabled(disabled, t.moduleId));

  useEffect(() => {
    const isVisible = visibleTabs.some(t => t.id === activeTab);
    if (!isVisible) setActiveTab("general");
  }, [disabled]);

  return (
    <div style={{
      marginLeft: 56,
      minHeight: "100vh",
      padding: "24px 28px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Page header */}
        <div style={{
          fontFamily: "'Syne',sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: C.text,
          marginBottom: 28,
        }}>
          Settings
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Left column — always visible */}
          <div style={{
            width: 320,
            flexShrink: 0,
            background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
            backdropFilter: "blur(24px) saturate(1.6)",
            WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "4px 20px 20px",
          }}>
            <ModulesSection />
          </div>

          {/* Right column — tabbed */}
          <div style={{
            flex: 1,
            minWidth: 0,
            background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
            backdropFilter: "blur(24px) saturate(1.6)",
            WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 0,
            overflow: "hidden",
          }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
              {visibleTabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                      marginBottom: -1,
                      cursor: "pointer",
                      color: active ? C.accent : C.textFaint,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Content area */}
            <div style={{ padding: "0 20px 20px" }}>
              {activeTab === "general" && <GeneralSection />}
              {activeTab === "location" && <LocationSection />}
              {activeTab === "news" && <NewsFeedsSection />}
              {activeTab === "calendar" && <CalendarSection />}
              {activeTab === "travel" && <TravelSection />}
              {activeTab === "films" && <FilmsSection />}
              {activeTab === "notes" && <NotesSection />}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 20,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9,
          color: C.textFaint,
          textAlign: "center",
        }}>
          Changes save automatically
        </div>
      </div>
    </div>
  );
}
