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

export type RawElevPoint = LatLng & { elevation: number }

export function computeAscentDescent(
  elevations: number[],
  minDeltaMeters: number = 2,
): { ascentMeters: number; descentMeters: number } {
  if (elevations.length === 0) return { ascentMeters: 0, descentMeters: 0 }
  let ascent = 0
  let descent = 0
  let last = elevations[0]
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - last
    if (Math.abs(delta) < minDeltaMeters) continue
    if (delta > 0) ascent += delta
    else descent += -delta
    last = elevations[i]
  }
  return { ascentMeters: ascent, descentMeters: descent }
}

export type AnalyzedTrack = {
  points: RoutePoint[]
  distanceMeters: number
  ascentMeters: number
  descentMeters: number
}

export function analyzeTrack(
  raw: RawElevPoint[],
  opts: { minDeltaMeters?: number } = {},
): AnalyzedTrack {
  const minDelta = opts.minDeltaMeters ?? 2

  if (raw.length === 0) {
    return { points: [], distanceMeters: 0, ascentMeters: 0, descentMeters: 0 }
  }

  let distance = 0
  const points: RoutePoint[] = new Array(raw.length)
  points[0] = {
    lat: raw[0].lat,
    lng: raw[0].lng,
    elevation: raw[0].elevation,
    distanceFromStart: 0,
  }
  for (let i = 1; i < raw.length; i++) {
    distance += haversineMeters(raw[i - 1], raw[i])
    points[i] = {
      lat: raw[i].lat,
      lng: raw[i].lng,
      elevation: raw[i].elevation,
      distanceFromStart: distance,
    }
  }

  let ascent = 0
  let descent = 0
  let lastSignificantElev = raw[0].elevation
  for (let i = 1; i < raw.length; i++) {
    const delta = raw[i].elevation - lastSignificantElev
    if (Math.abs(delta) < minDelta) continue
    if (delta > 0) ascent += delta
    else descent += -delta
    lastSignificantElev = raw[i].elevation
  }

  return { points, distanceMeters: distance, ascentMeters: ascent, descentMeters: descent }
}
