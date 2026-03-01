"use client";

import { useState, useEffect } from "react";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const C = {
  bg:        "#0c0c0c", surface:   "#141414", surfaceHi: "#1c1c1c",
  border:    "#242424", borderHi:  "#333333", accent:    "#c8f135",
  accentDim: "#c8f13522", accentMid: "#c8f13555",
  text:      "#f0f0f0", textMuted: "#888888", textFaint: "#3a3a3a",
  red: "#ff5c5c", amber: "#ffb347", teal: "#4ecdc4", blue: "#5b9bd5",
};

const PRAYER_TIMES = [
  { name: "Fajr",    time: "05:14" },
  { name: "Dhuhr",   time: "12:22" },
  { name: "Asr",     time: "15:45" },
  { name: "Maghrib", time: "18:31" },
  { name: "Isha",    time: "19:58" },
];

const HABITS_DATA = [
  { name: "Quran",    done: [1,1,1,1,1,0,0] },
  { name: "Exercise", done: [1,0,1,1,0,0,0] },
  { name: "Reading",  done: [1,1,1,0,0,0,0] },
  { name: "Water",    done: [1,1,1,1,1,1,0] },
];

const NEWS = [
  { source: "TechCrunch", title: "AI models now reasoning at human expert level across major benchmarks", time: "2h" },
  { source: "BBC",        title: "140 nations sign landmark climate agreement at Geneva summit", time: "4h" },
  { source: "The Verge",  title: "Apple unveils spatial computing SDK for third-party developers", time: "5h" },
  { source: "Reuters",    title: "Global markets rally as inflation data shows continued cooling trend", time: "7h" },
  { source: "Wired",      title: "The next wave of open-source models is quietly closing the gap", time: "9h" },
];

const QURAN_VERSES = [
  { arabic: "وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥ", translation: "And whoever relies upon Allah — then He is sufficient for him.", ref: "At-Talaq 65:3" },
  { arabic: "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا", translation: "For indeed, with hardship will be ease.", ref: "Ash-Sharh 94:5" },
  { arabic: "وَلَا تَيۡـَٔسُواْ مِن رَّوۡحِ ٱللَّهِ", translation: "And do not despair of relief from Allah.", ref: "Yusuf 12:87" },
  { arabic: "إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ", translation: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
  { arabic: "رَبِّ زِدۡنِي عِلۡمٗا", translation: "My Lord, increase me in knowledge.", ref: "Ta-Ha 20:114" },
  { arabic: "حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ", translation: "Sufficient for us is Allah, and He is the best disposer of affairs.", ref: "Al Imran 3:173" },
];

const CALENDAR_EVENTS = [
  { date: 3,  label: "Design review",      color: "#4ecdc4" },
  { date: 7,  label: "Doctor appointment", color: "#ff5c5c" },
  { date: 12, label: "Deploy v2.0",        color: "#c8f135" },
  { date: 15, label: "Team sync",          color: "#5b9bd5" },
  { date: 19, label: "Read: ch. 12",       color: "#ffb347" },
  { date: 24, label: "Sprint planning",    color: "#4ecdc4" },
  { date: 28, label: "Family dinner",      color: "#ffb347" },
];

const MONTHS_L  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const D_SHORT   = ["S","M","T","W","T","F","S"];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t;
}

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, position:"relative", overflow:"hidden", ...style }}>
      {children}
    </div>
  );
}
function Tag({ children, color = C.textFaint }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:400, letterSpacing:"1.5px", textTransform:"uppercase", color }}>{children}</span>;
}
function Dot({ color = C.accent, size = 6 }: { color?: string; size?: number }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color, boxShadow:`0 0 ${size*1.5}px ${color}88`, flexShrink:0 }} />;
}
function Sep() { return <div style={{ width:1, height:14, background:C.border, margin:"0 4px" }} />; }
function Stat({ icon, label, color, dim }: { icon?: string; label: string; color?: string; dim?: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      {icon && <span style={{ fontSize:11, opacity:0.7 }}>{icon}</span>}
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:color||(dim?C.textFaint:C.textMuted), letterSpacing:"0.2px" }}>{label}</span>
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function HeaderBar({ time }: { time: Date }) {
  const h=time.getHours(), m=time.getMinutes(), s=time.getSeconds();
  const greeting = h<5?"Good night":h<12?"Good morning":h<17?"Good afternoon":h<20?"Good evening":"Good night";
  const timeStr = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
  const curMins = h*60+m;
  const nextPrayer = PRAYER_TIMES.find(p => { const [ph,pm]=p.time.split(":").map(Number); return ph*60+pm>curMins; });
  const dayFrac = (h*3600+m*60+s)/86400;
  return (
    <div style={{ maxWidth:1280, margin:"0 auto 12px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Dot size={6} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:C.accent, letterSpacing:"-0.3px" }}>Hayati</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>{"· حياتي"}</span>
        </div>
        <div style={{ width:1, height:20, background:C.border }} />
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.textMuted }}>
          {greeting},&nbsp;<span style={{ color:C.text }}>Hussein</span>
        </span>
      </div>
      <div style={{ flex:1, maxWidth:340 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <Tag color={C.textFaint}>day progress</Tag>
          <Tag color={C.textMuted}>{(dayFrac*100).toFixed(0)}%</Tag>
        </div>
        <div style={{ height:3, background:C.border, borderRadius:2, position:"relative" }}>
          <div style={{ height:"100%", width:`${dayFrac*100}%`, background:`linear-gradient(90deg,${C.accent}77,${C.accent})`, borderRadius:2 }} />
          <div style={{ position:"absolute", top:-3, left:`${dayFrac*100}%`, width:1, height:9, background:C.accent, transform:"translateX(-50%)" }} />
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <Stat icon="&#9711;" label={timeStr} />
        <Sep /><Stat icon="&#8593;" label="06:12" dim /><Stat icon="&#8595;" label="18:31" dim />
        <Sep /><Stat icon="&#9728;" label="28°" color={C.amber} /><Stat label="Sunny" dim />
        <Sep />{nextPrayer && <Stat icon="&#128332;" label={`${nextPrayer.name} ${nextPrayer.time}`} color={C.accent} />}
      </div>
    </div>
  );
}

// ─── FOCUS ───────────────────────────────────────────────────────────────────
function FocusPanel() {
  const [focus, setFocus] = useState("Ship the Hayati dashboard");
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Panel style={{ borderColor:done?C.accent+"44":C.border, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <Tag color={done?C.accent:C.textFaint}>{"Today's focus"}</Tag>
        <button onClick={() => setDone(d=>!d)} style={{ width:20, height:20, borderRadius:"50%", border:`1.5px solid ${done?C.accent:C.borderHi}`, background:done?C.accent:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {done && <span style={{ fontSize:10, color:C.bg, fontWeight:700 }}>&#10003;</span>}
        </button>
      </div>
      {editing
        ? <input autoFocus value={focus} onChange={e=>setFocus(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>e.key==="Enter"&&setEditing(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.text }} />
        : <div onClick={()=>setEditing(true)} style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:done?C.textFaint:C.text, textDecoration:done?"line-through":"none", textDecorationColor:C.textFaint, cursor:"text", lineHeight:1.3 }}>{focus}</div>
      }
      <div style={{ marginTop:"auto", paddingTop:14, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, height:1, background:C.border }} />
        <Tag color={C.textFaint}>click to edit</Tag>
      </div>
    </Panel>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
type Task = { id: number; text: string; done: boolean; p: "high" | "med" | "low" };

function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([
    { id:1, text:"Review pull requests",   done:false, p:"high" },
    { id:2, text:"Fix auth bug on mobile",  done:false, p:"high" },
    { id:3, text:"Update README",           done:true,  p:"low"  },
    { id:4, text:"Design system audit",     done:false, p:"med"  },
    { id:5, text:"Read 20 pages",           done:false, p:"low"  },
  ]);
  const [input, setInput] = useState("");
  const pc: Record<string, string> = { high:C.red, med:C.amber, low:C.textFaint };
  const doneN = tasks.filter(t=>t.done).length;
  const add = () => { if(!input.trim()) return; setTasks(ts=>[...ts,{id:Date.now(),text:input.trim(),done:false,p:"med"}]); setInput(""); };
  return (
    <Panel style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Tasks</Tag>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textMuted }}>{doneN}/{tasks.length}</span>
      </div>
      <div style={{ height:2, background:C.border, borderRadius:1, marginBottom:14 }}>
        <div style={{ height:"100%", width:`${tasks.length?(doneN/tasks.length)*100:0}%`, background:C.accent, borderRadius:1, transition:"width .3s" }} />
      </div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
        {[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)].map(task => (
          <div key={task.id} onClick={()=>setTasks(ts=>ts.map(x=>x.id===task.id?{...x,done:!x.done}:x))}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 8px", borderRadius:6, cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget.style.background=C.surfaceHi)}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
          >
            <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, border:task.done?"none":`1px solid ${pc[task.p]}`, background:task.done?C.textFaint:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {task.done && <span style={{ fontSize:8, color:C.bg, fontWeight:900 }}>&#10003;</span>}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:task.done?C.textFaint:C.text, textDecoration:task.done?"line-through":"none", textDecorationColor:C.textFaint, flex:1, lineHeight:1.4 }}>{task.text}</span>
            {!task.done && <div style={{ width:4, height:4, borderRadius:"50%", background:pc[task.p], flexShrink:0 }} />}
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.textFaint }}>+</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="add task..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
      </div>
    </Panel>
  );
}

// ─── STATUS ───────────────────────────────────────────────────────────────────
function StatusPanel({ time }: { time: Date }) {
  const dayFrac = (time.getHours()*3600+time.getMinutes()*60+time.getSeconds())/86400;
  const metrics = [
    { label:"day",   val:`${(dayFrac*100).toFixed(0)}%`,                         bar:dayFrac,                  color:C.accent },
    { label:"week",  val:`${(((time.getDay()||7)/7)*100).toFixed(0)}%`,           bar:(time.getDay()||7)/7,     color:C.teal   },
    { label:"month", val:`${((time.getDate()/30)*100).toFixed(0)}%`,              bar:time.getDate()/30,        color:C.blue   },
  ];
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
        {[["location","Sharjah, AE"],["timezone","GMT+4"],["sunrise","06:12"],["sunset","18:31"]].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between" }}><Tag color={C.textFaint}>{k}</Tag><Tag color={C.textMuted}>{v}</Tag></div>
        ))}
      </div>
    </Panel>
  );
}

// ─── PRAYER ───────────────────────────────────────────────────────────────────
function PrayerPanel({ time }: { time: Date }) {
  const curMins = time.getHours()*60+time.getMinutes();
  const nextName = PRAYER_TIMES.find(p=>{ const [h,m]=p.time.split(":").map(Number); return h*60+m>curMins; })?.name;
  return (
    <Panel>
      <Tag color={C.textFaint}>Prayer times</Tag>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:14 }}>
        {PRAYER_TIMES.map((p,i) => {
          const [ph,pm]=p.time.split(":").map(Number), passed=ph*60+pm<curMins, isNext=p.name===nextName;
          return (
            <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<PRAYER_TIMES.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.textMuted, textDecoration:passed?"line-through":"none", textDecorationColor:C.textFaint, fontWeight:isNext?700:400 }}>{p.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.text, fontWeight:isNext?700:400 }}>{p.time}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
function NewsPanel() {
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

// ─── HABITS ───────────────────────────────────────────────────────────────────
function HabitsPanel({ time }: { time: Date }) {
  const [habits, setHabits] = useState(HABITS_DATA);
  const today = time.getDay();
  const toggle = (hi: number, di: number) => setHabits(prev => prev.map((h,i) => i===hi ? {...h, done:h.done.map((d,j)=>j===di?(d?0:1):d)} : h));
  return (
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <Tag color={C.textFaint}>Weekly habits</Tag>
        <div style={{ display:"flex", gap:4 }}>
          {D_SHORT.map((d,i) => <div key={i} style={{ width:22, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:i===today?C.accent:C.textFaint }}>{d}</div>)}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {habits.map((h,hi) => {
          const rev=[...h.done].reverse(), streak=rev.findIndex(d=>!d), realStreak=streak===-1?h.done.length:streak;
          return (
            <div key={h.name} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:72, fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, flexShrink:0 }}>{h.name}</div>
              <div style={{ flex:1, display:"flex", gap:4 }}>
                {h.done.map((done,di) => (
                  <div key={di} onClick={()=>toggle(hi,di)} style={{ flex:1, height:22, borderRadius:4, cursor:"pointer", background:done?C.accent:C.surfaceHi, border:`1px solid ${di===today?C.borderHi:C.border}`, boxShadow:done?`0 0 8px ${C.accent}44`:"none", transition:"all .15s" }} />
                ))}
              </div>
              <div style={{ width:28, textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:realStreak>0?C.accent:C.textFaint }}>{realStreak>0?`${realStreak}🔥`:"—"}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ─── QURAN ────────────────────────────────────────────────────────────────────
function QuranPanel() {
  const verse = QURAN_VERSES[new Date().getDate() % QURAN_VERSES.length];
  return (
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ position:"absolute", bottom:-10, right:12, fontFamily:"'Scheherazade New',serif", fontSize:80, color:C.accent, opacity:0.04, lineHeight:1, pointerEvents:"none", userSelect:"none", direction:"rtl" }}>{"٣٥١"}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <Tag color={C.textFaint}>{"Quran · verse of the day"}</Tag>
        <Tag color={C.textFaint}>{verse.ref}</Tag>
      </div>
      <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:22, color:C.text, direction:"rtl", textAlign:"right", lineHeight:1.8, marginBottom:14 }}>{verse.arabic}</div>
      <div style={{ height:1, background:C.border, marginBottom:12 }} />
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textMuted, lineHeight:1.7, fontStyle:"italic" }}>"{verse.translation}"</div>
    </Panel>
  );
}

// ─── CURRENT READS ────────────────────────────────────────────────────────────
type Book = { id: number; title: string; author: string; progress: number; color: string };

function CurrentReadsPanel() {
  const [books, setBooks] = useState<Book[]>([
    { id:1, title:"The Almanack of Naval Ravikant", author:"Eric Jorgenson", progress:68, color:C.accent },
    { id:2, title:"Clean Code", author:"Robert C. Martin", progress:34, color:C.teal },
  ]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title:"", author:"" });
  const addBook = () => {
    if (!draft.title.trim()) return;
    const cols=[C.accent,C.teal,C.amber,C.blue];
    setBooks(b=>[...b,{id:Date.now(),title:draft.title.trim(),author:draft.author.trim(),progress:0,color:cols[b.length%cols.length]}]);
    setDraft({title:"",author:""}); setAdding(false);
  };
  const nudge = (id: number, delta: number) => setBooks(b=>b.map(x=>x.id===id?{...x,progress:Math.min(100,Math.max(0,x.progress+delta))}:x));
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <Tag color={C.textFaint}>Currently reading</Tag>
        <button onClick={()=>setAdding(a=>!a)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:adding?C.accent:C.textFaint }}>{adding?"cancel":"+ add"}</button>
      </div>
      {adding && (
        <div style={{ display:"flex", gap:8, marginBottom:16, padding:"10px 12px", background:C.surfaceHi, borderRadius:8, border:`1px solid ${C.border}` }}>
          <input autoFocus value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder="title..." style={{ flex:2, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
          <div style={{ width:1, background:C.border }} />
          <input value={draft.author} onChange={e=>setDraft(d=>({...d,author:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addBook()} placeholder="author..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
          <button onClick={addBook} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>add</button>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {books.map(book => (
          <div key={book.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{book.title}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>{book.author}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>nudge(book.id,-5)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textFaint, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>&#8722;</button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:book.color, minWidth:30, textAlign:"center" }}>{book.progress}%</span>
                <button onClick={()=>nudge(book.id,5)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textFaint, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>+</button>
              </div>
            </div>
            <div style={{ height:3, background:C.border, borderRadius:2 }}>
              <div style={{ height:"100%", width:`${book.progress}%`, background:book.color, borderRadius:2, boxShadow:`0 0 8px ${book.color}55`, transition:"width .3s" }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── READING LIST ─────────────────────────────────────────────────────────────
type ReadingItem = { id: number; title: string; type: "book" | "essay" | "article"; done: boolean };

function ReadingListPanel() {
  const [items, setItems] = useState<ReadingItem[]>([
    { id:1, title:"The Pragmatic Programmer",              type:"book",    done:false },
    { id:2, title:"You and Your Research — Hamming",       type:"essay",   done:false },
    { id:3, title:"Designing Data-Intensive Applications", type:"book",    done:false },
    { id:4, title:"Paul Graham — Taste for Makers",        type:"essay",   done:true  },
    { id:5, title:"Shape Up by Basecamp",                  type:"article", done:true  },
  ]);
  const [input, setInput] = useState("");
  const tc: Record<string, string> = {book:C.teal,essay:C.amber,article:C.blue};
  const tl: Record<string, string> = {book:"BK",essay:"ES",article:"AR"};
  const add = () => { if(!input.trim()) return; setItems(i=>[...i,{id:Date.now(),title:input.trim(),type:"article",done:false}]); setInput(""); };
  const unread=items.filter(i=>!i.done), read=items.filter(i=>i.done);
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Reading list</Tag>
        <Tag color={C.textMuted}>{unread.length} to read</Tag>
      </div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:1 }}>
        {[...unread,...read].map((item,i,arr) => (
          <div key={item.id} onClick={()=>setItems(prev=>prev.map(x=>x.id===item.id?{...x,done:!x.done}:x))}
            style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget.style.opacity=".75")}
            onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
          >
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:item.done?C.textFaint:tc[item.type], width:16, flexShrink:0 }}>{tl[item.type]}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:item.done?C.textFaint:C.text, textDecoration:item.done?"line-through":"none", textDecorationColor:C.textFaint, flex:1, lineHeight:1.4 }}>{item.title}</span>
            <div style={{ width:12, height:12, borderRadius:3, border:`1px solid ${item.done?C.textFaint:C.borderHi}`, background:item.done?C.textFaint:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.done && <span style={{ fontSize:7, color:C.bg, fontWeight:900 }}>&#10003;</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.textFaint }}>+</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="add to list..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
      </div>
    </Panel>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
type CalEvent = { date: number; label: string; color: string };

function CalendarPanel({ time }: { time: Date }) {
  const today=time.getDate(), thisMonth=time.getMonth(), thisYear=time.getFullYear();
  const [viewing, setViewing] = useState({ month:thisMonth, year:thisYear });
  const [events, setEvents] = useState<CalEvent[]>(CALENDAR_EVENTS);
  const [selected, setSelected] = useState<number|null>(null);
  const [draft, setDraft] = useState("");
  const isCurMonth = viewing.month===thisMonth && viewing.year===thisYear;
  const firstDay=new Date(viewing.year,viewing.month,1).getDay();
  const daysInMonth=new Date(viewing.year,viewing.month+1,0).getDate();
  const cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const evForDay=(d: number)=>events.filter(e=>e.date===d);
  const addEvent=()=>{ if(!draft.trim()||!selected) return; const cols=[C.accent,C.teal,C.amber,C.blue,C.red]; setEvents(ev=>[...ev,{date:selected,label:draft.trim(),color:cols[ev.length%cols.length]}]); setDraft(""); };
  const prev=()=>setViewing(v=>({month:v.month===0?11:v.month-1,year:v.month===0?v.year-1:v.year}));
  const next=()=>setViewing(v=>({month:v.month===11?0:v.month+1,year:v.month===11?v.year+1:v.year}));
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Tag color={C.textFaint}>Calendar</Tag>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:C.text }}>{MONTHS_L[viewing.month]} {viewing.year}</span>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={prev} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"2px 8px", lineHeight:1.6 }}>&#8249;</button>
          {!isCurMonth && <button onClick={()=>setViewing({month:thisMonth,year:thisYear})} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.accent, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"2px 8px", lineHeight:1.6 }}>today</button>}
          <button onClick={next} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"2px 8px", lineHeight:1.6 }}>&#8250;</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {DAY_LABELS.map(d=><div key={d} style={{ textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((day,i) => {
          if (!day) return <div key={`e${i}`} />;
          const isToday=isCurMonth&&day===today, isSel=day===selected, dayEvs=evForDay(day);
          return (
            <div key={day} onClick={()=>setSelected(s=>s===day?null:day)}
              style={{ borderRadius:6, padding:"5px 3px 4px", textAlign:"center", cursor:"pointer", background:isToday?C.accent:isSel?C.surfaceHi:"transparent", border:`1px solid ${isSel&&!isToday?C.borderHi:"transparent"}`, transition:"background .1s" }}
              onMouseEnter={e=>{ if(!isToday) e.currentTarget.style.background=C.surfaceHi; }}
              onMouseLeave={e=>{ if(!isToday&&!isSel) e.currentTarget.style.background="transparent"; else if(isSel&&!isToday) e.currentTarget.style.background=C.surfaceHi; }}
            >
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:isToday?700:400, color:isToday?C.bg:isSel?C.text:C.textMuted, display:"block", lineHeight:1 }}>{day}</span>
              {dayEvs.length>0 && <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:3 }}>{dayEvs.slice(0,3).map((ev,di)=><div key={di} style={{ width:3, height:3, borderRadius:"50%", background:isToday?C.bg+"cc":ev.color }} />)}</div>}
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <Tag color={C.textFaint}>{MONTHS_L[viewing.month]} {selected}</Tag>
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
            {evForDay(selected).length===0 && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>no events</div>}
            {evForDay(selected).map((ev,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:ev.color }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textMuted, flex:1 }}>{ev.label}</span>
                <button onClick={()=>setEvents(ev2=>ev2.filter(e=>!(e.date===selected&&e.label===ev.label)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, fontSize:11 }}>&#215;</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textFaint }}>+</span>
            <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEvent()} placeholder="add event..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
            <button onClick={addEvent} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>add</button>
          </div>
        </div>
      )}
    </Panel>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Hayati() {
  const time = useClock();
  return (
    <div style={{ minHeight:"100vh", background:"#0c0c0c", padding:"24px 28px" }}>
      <HeaderBar time={time} />
      <div className="hg" style={{ maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gridAutoRows:"auto", gap:12 }}>
        <FocusPanel />
        <TasksPanel />
        <StatusPanel time={time} />
        <PrayerPanel time={time} />
        <NewsPanel />
        <HabitsPanel time={time} />
        <QuranPanel />
        <CurrentReadsPanel />
        <ReadingListPanel />
        <CalendarPanel time={time} />
      </div>
      <div style={{ maxWidth:1280, margin:"12px auto 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#3a3a3a", letterSpacing:"1px" }}>HAYATI v2.0 · حياتي</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#3a3a3a" }}>
          {time.getHours().toString().padStart(2,"0")}:{time.getMinutes().toString().padStart(2,"0")} · Sharjah
        </span>
      </div>
    </div>
  );
}
