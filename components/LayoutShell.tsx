"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Background } from "./Background";
import { useGlobalSettings } from "@/lib/settings";
import { useAssistant } from "@/app/providers";

const DRAWER_WIDTH = 480;

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { global, updateGlobal } = useGlobalSettings();
  const fullscreen = global.fullscreen;
  const { open: assistantOpen } = useAssistant();

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
      <Background />
      {!fullscreen && <Sidebar />}
      <main style={{
        marginLeft: fullscreen ? 0 : 56,
        marginRight: assistantOpen ? DRAWER_WIDTH : 0,
        paddingBottom: 28,
        transition: "margin-right 0.25s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        zIndex: 1,
      }}>
        {children}
      </main>
    </>
  );
}
