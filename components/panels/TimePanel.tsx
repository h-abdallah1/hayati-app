"use client";

import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useWeather, getPrayerTimes } from "@/lib/hooks";
import { convertHHMM } from "@/lib/time";
import { Panel, Tag } from "@/components/ui";

function getTzOffset(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find(p => p.type === "timeZoneName")?.value ?? "";
  } catch { return ""; }
}

export function TimePanel({ time }: { time: Date }) {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const wx = useWeather(global.location);
  const PRAYER_TIMES = getPrayerTimes(global.location, global.timeFormat);
  const dayFrac = (time.getHours()*3600+time.getMinutes()*60+time.getSeconds())/86400;
  const metrics = [
    { label:"day",   val:`${(dayFrac*100).toFixed(0)}%`,                       bar:dayFrac,              color:C.accent },
    { label:"week",  val:`${(((time.getDay()||7)/7)*100).toFixed(0)}%`,         bar:(time.getDay()||7)/7, color:C.teal   },
    { label:"month", val:`${((time.getDate()/30)*100).toFixed(0)}%`,            bar:time.getDate()/30,    color:C.blue   },
  ];
  const tzOffset = getTzOffset(global.location.tz);
  const curMins = time.getHours()*60+time.getMinutes();
  const nextName = PRAYER_TIMES.find(p => p.mins > curMins)?.name;

  return (
    <Panel>
      <Tag color={C.textFaint}>Time</Tag>

      {/* Progress bars */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:14 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <Tag color={C.textMuted}>{m.label}</Tag>
              <Tag color={m.color}>{m.val}</Tag>
            </div>
            <div style={{ height:3, background:C.border, borderRadius:2 }}>
              <div style={{ height:"100%", width:`${Math.min(m.bar*100,100)}%`, background:m.color, borderRadius:2, boxShadow:`0 0 6px ${m.color}66` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Location / sun */}
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:16 }}>
        {([
          ["location", global.location.label],
          ["timezone", tzOffset || global.location.tz],
          ["sunrise",  convertHHMM(wx.sunrise, global.timeFormat)],
          ["sunset",   convertHHMM(wx.sunset,  global.timeFormat)],
        ] as [string, string][]).map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
            <Tag color={C.textFaint}>{k}</Tag>
            <Tag color={C.textMuted}>{v}</Tag>
          </div>
        ))}
      </div>

      <div style={{ height:1, background:C.border, margin:"16px 0" }} />

      {/* Prayer times */}
      <Tag color={C.textFaint}>Prayer times</Tag>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:10 }}>
        {PRAYER_TIMES.map((p, i) => {
          const passed = p.mins < curMins, isNext = p.name === nextName;
          return (
            <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<PRAYER_TIMES.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.textMuted, textDecoration:passed?"line-through":"none", textDecorationColor:C.textFaint, fontWeight:isNext?700:400 }}>{p.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.text, fontWeight:isNext?700:400 }}>{p.time}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
