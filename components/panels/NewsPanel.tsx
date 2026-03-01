import { C } from "@/lib/design";
import { NEWS } from "@/lib/data";
import { Panel, Tag, Dot } from "@/components/ui";

export function NewsPanel() {
  return (
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Latest news</Tag>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}><Dot size={4} /><Tag color={C.textMuted}>live</Tag></div>
      </div>
      <div style={{ display:"flex", flexDirection:"column" }}>
        {NEWS.map((n,i) => (
          <div key={i}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"9px 0" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.accent, fontWeight:700, width:80, flexShrink:0, paddingTop:2, letterSpacing:"0.3px" }}>{n.source.toUpperCase()}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, lineHeight:1.55, flex:1 }}>{n.title}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, flexShrink:0, paddingTop:2 }}>{n.time}</span>
            </div>
            {i<NEWS.length-1 && <div style={{ height:1, background:C.border }} />}
          </div>
        ))}
      </div>
    </Panel>
  );
}
