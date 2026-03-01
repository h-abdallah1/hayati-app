"use client";

import { useTheme } from "@/lib/theme";
import { useSettings } from "@/lib/settings";
import { useWeather } from "@/lib/hooks";
import { convertHHMM } from "@/lib/time";
import { Panel, Tag } from "@/components/ui";

function getTzOffset(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find(p => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function StatusPanel({ time }: { time: Date }) {
  const C = useTheme();
  const { settings } = useSettings();
  const wx = useWeather(settings.location);
  const dayFrac = (time.getHours()*3600+time.getMinutes()*60+time.getSeconds())/86400;
  const metrics = [
    { label:"day",   val:`${(dayFrac*100).toFixed(0)}%`,                         bar:dayFrac,                  color:C.accent },
    { label:"week",  val:`${(((time.getDay()||7)/7)*100).toFixed(0)}%`,           bar:(time.getDay()||7)/7,     color:C.teal   },
    { label:"month", val:`${((time.getDate()/30)*100).toFixed(0)}%`,              bar:time.getDate()/30,        color:C.blue   },
  ];
  const tzOffset = getTzOffset(settings.location.tz);
  return (
    <Panel>
      <Tag color={C.textFaint}>Time status</Tag>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:14 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><Tag color={C.textMuted}>{m.label}</Tag><Tag color={m.color}>{m.val}</Tag></div>
            <div style={{ height:3, background:C.border, borderRadius:2 }}><div style={{ height:"100%", width:`${Math.min(m.bar*100,100)}%`, background:m.color, borderRadius:2, boxShadow:`0 0 6px ${m.color}66` }} /></div>
          </div>
        ))}
      </div>
      <div style={{ height:1, background:C.border, margin:"16px 0" }} />
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {([
          ["location", settings.location.label],
          ["timezone", tzOffset || settings.location.tz],
          ["sunrise", convertHHMM(wx.sunrise, settings.timeFormat)],
          ["sunset",  convertHHMM(wx.sunset,  settings.timeFormat)],
        ] as [string, string][]).map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between" }}><Tag color={C.textFaint}>{k}</Tag><Tag color={C.textMuted}>{v}</Tag></div>
        ))}
      </div>
    </Panel>
  );
}
