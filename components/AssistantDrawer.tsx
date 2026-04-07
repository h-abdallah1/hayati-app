"use client";

import { useRouter } from "next/navigation";
import { X, ExternalLink } from "lucide-react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { ChatPanel } from "./ChatPanel";

export function AssistantDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const router = useRouter();

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: 480,
      background: isDark ? "rgba(10, 10, 18, 0.60)" : "rgba(248, 248, 244, 0.68)",
      backdropFilter: "blur(20px) saturate(1.6)",
      WebkitBackdropFilter: "blur(20px) saturate(1.6)",
      borderLeft: `1px solid ${C.border}`,
      zIndex: 201,
      display: "flex",
      flexDirection: "column",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <ChatPanel
        active={open}
        headerActions={
          <>
            <button
              onClick={() => { onClose(); router.push("/chat"); }}
              title="Open as page"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, padding: 4, display: "flex" }}
            >
              <ExternalLink size={14} strokeWidth={1.7} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, padding: 4, display: "flex" }}
            >
              <X size={14} strokeWidth={1.7} />
            </button>
          </>
        }
      />
    </div>
  );
}
