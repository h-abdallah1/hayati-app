import { C } from "@/lib/design";

export function Dot({ color = C.accent, size = 6 }: { color?: string; size?: number }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color, boxShadow:`0 0 ${size*1.5}px ${color}88`, flexShrink:0 }} />;
}
