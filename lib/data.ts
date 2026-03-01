import type { CalEvent } from "./types";

export const PRAYER_TIMES = [
  { name: "Fajr",    time: "05:14" },
  { name: "Dhuhr",   time: "12:22" },
  { name: "Asr",     time: "15:45" },
  { name: "Maghrib", time: "18:31" },
  { name: "Isha",    time: "19:58" },
];

export const HABITS_DATA = [
  { name: "Quran",    done: [1,1,1,1,1,0,0] },
  { name: "Exercise", done: [1,0,1,1,0,0,0] },
  { name: "Reading",  done: [1,1,1,0,0,0,0] },
  { name: "Water",    done: [1,1,1,1,1,1,0] },
];

export const NEWS = [
  { source: "TechCrunch", title: "AI models now reasoning at human expert level across major benchmarks", time: "2h" },
  { source: "BBC",        title: "140 nations sign landmark climate agreement at Geneva summit", time: "4h" },
  { source: "The Verge",  title: "Apple unveils spatial computing SDK for third-party developers", time: "5h" },
  { source: "Reuters",    title: "Global markets rally as inflation data shows continued cooling trend", time: "7h" },
  { source: "Wired",      title: "The next wave of open-source models is quietly closing the gap", time: "9h" },
];

export const QURAN_VERSES = [
  { arabic: "وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥ", translation: "And whoever relies upon Allah — then He is sufficient for him.", ref: "At-Talaq 65:3" },
  { arabic: "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا", translation: "For indeed, with hardship will be ease.", ref: "Ash-Sharh 94:5" },
  { arabic: "وَلَا تَيۡـَٔسُواْ مِن رَّوۡحِ ٱللَّهِ", translation: "And do not despair of relief from Allah.", ref: "Yusuf 12:87" },
  { arabic: "إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ", translation: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
  { arabic: "رَبِّ زِدۡنِي عِلۡمٗا", translation: "My Lord, increase me in knowledge.", ref: "Ta-Ha 20:114" },
  { arabic: "حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ", translation: "Sufficient for us is Allah, and He is the best disposer of affairs.", ref: "Al Imran 3:173" },
];

export const CALENDAR_EVENTS: CalEvent[] = [
  { date: 3,  label: "Design review",      color: "#4ecdc4" },
  { date: 7,  label: "Doctor appointment", color: "#ff5c5c" },
  { date: 12, label: "Deploy v2.0",        color: "#c8f135" },
  { date: 15, label: "Team sync",          color: "#5b9bd5" },
  { date: 19, label: "Read: ch. 12",       color: "#ffb347" },
  { date: 24, label: "Sprint planning",    color: "#4ecdc4" },
  { date: 28, label: "Family dinner",      color: "#ffb347" },
];

export const MONTHS_L  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const D_SHORT   = ["S","M","T","W","T","F","S"];
export const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
