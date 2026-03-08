"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/lib/theme";
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

function FinanceSection() {
  const C = useTheme();
  const { global, updateGlobal } = useGlobalSettings();
  const [sendersVal, setSendersVal] = useState((global.smsConfig?.senders ?? []).join("\n"));

  const saveSenders = () => {
    const senders = sendersVal.split("\n").map((s: string) => s.trim()).filter(Boolean);
    updateGlobal({ smsConfig: { ...(global.smsConfig ?? { enabled: false }), senders } });
  };
  const toggleSms = () => {
    updateGlobal({ smsConfig: { ...(global.smsConfig ?? { senders: [] }), enabled: !global.smsConfig?.enabled } });
  };

  return (
    <>
      <div style={sectionHead(C)}>Finance</div>
      <div style={{ marginBottom: 12 }}>
        <span style={fieldLabel(C)}>Payment day of month</span>
        <input
          type="number"
          min={1}
          max={28}
          value={global.paymentDay ?? 1}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1 && v <= 28) updateGlobal({ paymentDay: v });
          }}
          style={{ ...inputStyle(C), width: 60 }}
        />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 4 }}>
          Day you receive your salary (1–28). Months on the finance page run from this day.
        </div>
      </div>

      <div style={sectionHead(C)}>SMS Import</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={fieldLabel(C)}>Import from Mac Messages</span>
          <button onClick={toggleSms} style={{
            background: global.smsConfig?.enabled ? C.accentDim : "none",
            border: `1px solid ${global.smsConfig?.enabled ? C.accent : C.border}`,
            borderRadius: 5, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: global.smsConfig?.enabled ? C.accent : C.textFaint,
            padding: "3px 10px", letterSpacing: "0.3px",
          }}>
            {global.smsConfig?.enabled ? "on" : "off"}
          </button>
        </div>
        <span style={fieldLabel(C)}>Bank sender names / numbers (one per line)</span>
        <textarea
          value={sendersVal}
          onChange={e => setSendersVal(e.target.value)}
          onBlur={saveSenders}
          placeholder={"ENBD\nFAB\nADCB\n+97150xxxxxxx"}
          rows={4}
          style={{
            ...inputStyle(C),
            resize: "vertical",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            lineHeight: 1.6,
          }}
        />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 5, lineHeight: 1.6 }}>
          Requires: iPhone → Mac SMS forwarding on, and Full Disk Access for Terminal in System Settings → Privacy &amp; Security.
        </div>
      </div>
    </>
  );
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
  { id: "finance", label: "Finance", moduleId: "finance" },
  { id: "travel", label: "Travel", moduleId: "travel" },
  { id: "films", label: "Films", moduleId: "films" },
  { id: "notes", label: "Notes", moduleId: "notes" },
] as const;

export default function SettingsPage() {
  const C = useTheme();
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
      background: C.bg,
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
            background: C.surface,
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
            background: C.surface,
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
              {activeTab === "finance" && <FinanceSection />}
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
