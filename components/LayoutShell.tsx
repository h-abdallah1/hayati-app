"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useGlobalSettings } from "@/lib/settings";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { global, updateGlobal } = useGlobalSettings();
  const fullscreen = global.fullscreen;

  // Toggle with F key when not typing in an input/textarea
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "f" || e.key === "F") {
        updateGlobal({ fullscreen: !fullscreen });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, updateGlobal]);

  return (
    <>
      {!fullscreen && <Sidebar />}
      <main style={{ marginLeft: fullscreen ? 0 : 56, paddingBottom: 28 }}>
        {children}
      </main>
    </>
  );
}
