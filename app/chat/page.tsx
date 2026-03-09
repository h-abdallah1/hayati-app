"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  const C = useTheme();
  const router = useRouter();
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

  return (
    <div style={{ height: "calc(100vh - 28px)", display: "flex", flexDirection: "column" }}>
      <ChatPanel
        maxWidth={760}
        inputRows={4}
        headerActions={
          <button
            onClick={() => router.back()}
            title="Back"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.textFaint, padding: 4, display: "flex", alignItems: "center", gap: 5,
              ...mono, fontSize: 10,
            }}
          >
            <ArrowLeft size={13} strokeWidth={1.7} />
            back
          </button>
        }
      />
    </div>
  );
}
