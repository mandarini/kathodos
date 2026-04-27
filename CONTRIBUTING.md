# Contributing

Thanks for taking the time. A few quick notes.

## Setup

See [README.md](./README.md#setup) for environment setup. You'll need a Google Maps API key with the five APIs enabled — without it, the app throws at startup with a helpful message.

## Before sending a PR

```bash
pnpm lint     # ESLint must pass
pnpm build    # tsc + Vite build must pass
```

If you're touching the elevation or routing logic, please test end-to-end against at least two real routes — one obvious climb (e.g. Athens center → Lycabettus area) and one flat (e.g. Faliro → Glyfada). Numbers and chart shape should match what you observe on the map.

## Style

- Prefer editing existing files; avoid scaffolding new abstractions until there are at least three call sites.
- Keep the seam between routing engines clean — they all normalize to the `Route` type in `src/lib/types.ts`. UI code should never branch on engine internals.
- No comments explaining *what* the code does; reserve comments for *why* something non-obvious is needed (e.g. workarounds, hidden constraints).

## Bug reports

Please include:
- Browser + OS
- Start and destination (text or lat/lng)
- Screenshot of the chart and the stats panel
- DevTools console output if anything is red
