import type { LatLng, RoutePoint } from '../types'

const EARTH_RADIUS_M = 6_371_000

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

function movingAverage(values: number[], window: number): number[] {
  if (values.length === 0) return []
  const half = Math.floor(window / 2)
  const out = new Array<number>(values.length)
  for (let i = 0; i < values.length; i++) {
    const lo = Math.max(0, i - half)
    const hi = Math.min(values.length - 1, i + half)
    let sum = 0
    for (let j = lo; j <= hi; j++) sum += values[j]
    out[i] = sum / (hi - lo + 1)
  }
  return out
}

export type RawElevPoint = LatLng & { elevation: number }

export type AnalyzedTrack = {
  points: RoutePoint[]
  distanceMeters: number
  ascentMeters: number
  descentMeters: number
}

export function analyzeTrack(
  raw: RawElevPoint[],
  opts: { smoothingWindow?: number; minDeltaMeters?: number } = {},
): AnalyzedTrack {
  const smoothingWindow = opts.smoothingWindow ?? 5
  const minDelta = opts.minDeltaMeters ?? 1

  if (raw.length === 0) {
    return { points: [], distanceMeters: 0, ascentMeters: 0, descentMeters: 0 }
  }

  const smoothedElev = movingAverage(
    raw.map((p) => p.elevation),
    smoothingWindow,
  )

  let distance = 0
  const points: RoutePoint[] = new Array(raw.length)
  points[0] = {
    lat: raw[0].lat,
    lng: raw[0].lng,
    elevation: smoothedElev[0],
    distanceFromStart: 0,
  }
  for (let i = 1; i < raw.length; i++) {
    distance += haversineMeters(raw[i - 1], raw[i])
    points[i] = {
      lat: raw[i].lat,
      lng: raw[i].lng,
      elevation: smoothedElev[i],
      distanceFromStart: distance,
    }
  }

  let ascent = 0
  let descent = 0
  let lastSignificantElev = smoothedElev[0]
  for (let i = 1; i < smoothedElev.length; i++) {
    const delta = smoothedElev[i] - lastSignificantElev
    if (Math.abs(delta) < minDelta) continue
    if (delta > 0) ascent += delta
    else descent += -delta
    lastSignificantElev = smoothedElev[i]
  }

  return { points, distanceMeters: distance, ascentMeters: ascent, descentMeters: descent }
}
