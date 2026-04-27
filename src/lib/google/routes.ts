import polyline from '@mapbox/polyline'
import type { LatLng, Route } from '../types'
import { analyzeTrack } from '../elevation/analyze'
import { sampleElevations } from './elevation'

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

export type GoogleBicycleRoute = {
  distanceMeters: number
  durationSeconds: number
  encodedPolyline: string
  decodedPath: LatLng[]
}

type ComputeRoutesResponse = {
  routes?: Array<{
    distanceMeters?: number
    duration?: string
    polyline?: { encodedPolyline?: string }
  }>
}

export async function getGoogleBicycleRoutes(
  start: LatLng,
  end: LatLng,
  apiKey: string,
): Promise<GoogleBicycleRoute[]> {
  const body = {
    origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
    destination: { location: { latLng: { latitude: end.lat, longitude: end.lng } } },
    travelMode: 'BICYCLE',
    computeAlternativeRoutes: true,
  }
  const res = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Google Routes request failed: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as ComputeRoutesResponse
  const routes = data.routes ?? []
  if (routes.length === 0) {
    throw new Error('Google returned no bicycle routes for this origin/destination')
  }
  return routes.map((r) => {
    const encoded = r.polyline?.encodedPolyline ?? ''
    const decoded = polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }))
    return {
      distanceMeters: r.distanceMeters ?? 0,
      durationSeconds: parseDuration(r.duration ?? '0s'),
      encodedPolyline: encoded,
      decodedPath: decoded,
    }
  })
}

function parseDuration(s: string): number {
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

export async function getLowestAscentGoogleRoute(
  start: LatLng,
  end: LatLng,
  apiKey: string,
): Promise<Route> {
  const candidates = await getGoogleBicycleRoutes(start, end, apiKey)

  const analyzed = await Promise.all(
    candidates.map(async (cand) => {
      const samplesNeeded = Math.max(
        20,
        Math.min(512, Math.ceil(cand.distanceMeters / 50)),
      )
      const samples = await sampleElevations(cand.encodedPolyline, samplesNeeded, apiKey)
      const track = analyzeTrack(samples)
      return { cand, track }
    }),
  )

  analyzed.sort((a, b) => a.track.ascentMeters - b.track.ascentMeters)
  const best = analyzed[0]

  return {
    source: 'google',
    points: best.track.points,
    distanceMeters: best.cand.distanceMeters || best.track.distanceMeters,
    durationSeconds: best.cand.durationSeconds,
    ascentMeters: best.track.ascentMeters,
    descentMeters: best.track.descentMeters,
  }
}
