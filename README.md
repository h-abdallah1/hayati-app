# hayati

A personal life dashboard. Hayati (حياتي) means "my life" in Arabic.

It brings together the things you track day-to-day — workouts, films, books, games, notes, prayer times, news, travel — into a single local-first app with a clean, dark-by-default UI and animated backgrounds.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## Pages

| Page | What it does |
|------|-------------|
| **Dashboard** | Customisable widget grid — weather, clock, GitHub heatmap, prayer times, AI chat, Pomodoro timer, and more |
| **Overview** | Year-at-a-glance: activity heatmaps for gym, notes, films, and GitHub; goals progress; reading and gaming logs |
| **Gym** | Full workout analytics from Hevy — volume, PRs, streaks, exercise breakdowns, year heatmap |
| **Films** | Letterboxd diary with poster grid, timeline view, ratings, and filters |
| **Reading** | Book log with cover art, finish dates, and Open Library integration |
| **Gaming** | Game log with cover art via SteamGridDB, platforms, and ratings |
| **Notes** | Obsidian vault browser — file tree, graph view, backlinks, markdown editor with auto-save |
| **Prayer** | Daily prayer times with countdown, calculated locally using the Adhan library |
| **Travel** | World map (flat + globe) to track visited countries |
| **News** | RSS reader with custom feeds and full article extraction |

---

## Features

- **Animated backgrounds** — Mesh, Aurora, Space, Night, Rain, Matrix, Fireflies, Network, Gradient
- **Light / dark mode** with multiple accent colour themes
- **Demo mode** — replaces all personal data with a fake persona for screenshots or sharing
- **Local-first** — data lives in your browser and a local SQLite database; nothing is sent anywhere except your configured integrations
- **Local AI** — optional Ollama integration for an on-device chat panel

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values you need:

```bash
cp .env.example .env.local
```

| Variable | Required for | Where to get it |
|----------|--------------|-----------------|
| `HEVY_API_KEY` | Gym features | Hevy app → Profile → Settings → API |
| `STEAMGRIDDB_API_KEY` | Game cover art | [steamgriddb.com/profile/preferences/api](https://www.steamgriddb.com/profile/preferences/api) |

All other integrations (GitHub, Letterboxd, Obsidian, Ollama, calendar feeds, news feeds) are configured inside the app under **Settings**.

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript 5
- **Storage** — localStorage + SQLite (`better-sqlite3`)
- **Maps** — D3 geo projections, TopoJSON, react-globe.gl
- **Prayer times** — Adhan.js (fully offline)
- **UI** — Inline styles, JetBrains Mono + Syne fonts, Lucide icons

---

## Demo mode

To share a screenshot or record a clip without exposing personal data, toggle **Demo mode** in Settings → General. It replaces your name, location, and all activity data with a fictional persona.
