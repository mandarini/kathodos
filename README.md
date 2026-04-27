# kathodos

> κάθοδος — *káthodos*, Greek for *descent*.

A bike route planner that picks the path with the **least cumulative climbing**, not the shortest or fastest one. Built because Athens is hilly and bikes don't have gears for spite.

Given a start and a destination, kathodos asks two routing engines for their best bike route and reranks them by ascent:

- **[BRouter](https://brouter.de/)** — open-source, climb-aware bike routing graph (no API key)
- **[Google Routes API](https://developers.google.com/maps/documentation/routes)** — falls back to the driving network where Google has no bicycle data (common outside northern Europe / North America)

For each engine, the app fetches up to four alternative routes, samples elevation along every candidate, and picks the one with the lowest cumulative climb. It then plots both winners side-by-side on the map and on an elevation profile chart, with stats and GPX export per route.

## Features

- Two-engine comparison: BRouter (climb-aware graph) vs Google (rerank by ascent)
- Elevation chart with raw DEM samples — small hills don't get smoothed away
- Two elevation lines for the BRouter route (BRouter's native SRTM + Google DEM at the same coordinates) — see how the two data sources disagree
- Distance, ascent, descent, ETA per route
- "Use my location" via browser geolocation
- GPX export — drop into Strava, Komoot, RideWithGPS, Garmin Connect
- Dark mode

## Stack

- Vite + React 19 + TypeScript
- Google Maps JavaScript SDK (loaded natively, no React wrapper)
- BRouter public web service (https://brouter.de/brouter)
- `@mapbox/polyline` for Google's encoded polylines
- Hand-rolled SVG elevation chart (no chart library)

No backend. Everything runs in the browser.

## Setup

### 1. Get a Google Maps API key

1. Open [Google Cloud Console](https://console.cloud.google.com), create or pick a project, attach a billing account (the free tier covers personal use comfortably).
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Routes API**
   - **Places API (New)** — note: separate from the legacy *Places API*
   - **Elevation API** (also called *Maps Elevation API*)
   - **Geocoding API**
3. APIs & Services → Credentials → Create credentials → API key.
4. Restrict the key (recommended):
   - **Application restrictions** → HTTP referrers → add `http://localhost:5173/*` and any production domain.
   - **API restrictions** → restrict to the five APIs above.

### 2. Configure the app

```bash
cp .env.local.example .env.local
# edit .env.local and paste your key
```

### 3. Install and run

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:5173>.

## Scripts

- `pnpm dev` — Vite dev server with HMR
- `pnpm build` — type check + production build to `dist/`
- `pnpm preview` — serve the production build locally
- `pnpm lint` — ESLint

## How it works

```
src/
  components/                       UI components (map, form, chart, stats)
  lib/
    brouter/client.ts               BRouter request + alternatives reranking
    google/
      loader.ts                     Maps JS SDK loader (native API)
      routes.ts                     Routes API + bicycle/drive fallback + ascent rerank
      elevation.ts                  ElevationService wrapper, browser-CORS-safe
    elevation/analyze.ts            Cumulative ascent/descent with noise threshold
    gpx/export.ts                   Route → GPX string + download
    types.ts                        Normalized Route shape (the seam between engines)
```

The `Route` type is the contract every component downstream consumes. Both engine clients normalize to it.

### Elevation comparison

For honest numbers, we sample **the same coordinates** through both BRouter's native SRTM data *and* Google's DEM via the Elevation API (chunked into 512-point requests so dense paths aren't truncated). Both lines render on the chart so you can see where the two DEMs disagree.

### What "least climb" means in code

We don't use raw `delta > 0` summation — that inflates ascent from DEM noise. The threshold algorithm in `lib/elevation/analyze.ts` only counts elevation changes ≥ 2m sustained. This filters jitter without flattening real hills. Smoothing (moving average) is intentionally **not** applied because DEM data isn't GPS-noisy and smoothing was hiding genuine small climbs.

## Limitations

- Google Routes API picks alternatives by *its* criteria (mostly fastest); we rerank among the 1–3 it returns. If all of Google's options go over the same hill, we can't avoid it from this side.
- BRouter's public profile (`trekking`) balances climb against distance and surface. For maximum climb avoidance you'd self-host BRouter with a custom profile.
- Greece, parts of southern Europe, and many other regions don't have Google bicycle data. The app falls back to driving routes there — usable as a comparison baseline, not as a literal "ride this" suggestion.
- DEM elevation has ~30 m horizontal resolution and ~16 m vertical accuracy in dense urban areas. Some small Athenian hills may not show up cleanly.

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Katerina Skroumpelou
