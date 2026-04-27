import polyline from '@mapbox/polyline'
import type { LatLng } from '../types'
import { loadElevation } from './loader'

const MAX_PER_REQUEST = 512

let serviceRef: google.maps.ElevationService | null = null

async function getService(): Promise<google.maps.ElevationService> {
  if (serviceRef) return serviceRef
  const lib = await loadElevation()
  serviceRef = new lib.ElevationService()
  return serviceRef
}

export type ElevationSample = { lat: number; lng: number; elevation: number }

export async function sampleElevations(
  encodedPolyline: string,
  samples: number,
): Promise<ElevationSample[]> {
  const service = await getService()
  const path = polyline.decode(encodedPolyline).map(([lat, lng]) => ({ lat, lng }))
  const n = Math.max(2, Math.min(MAX_PER_REQUEST, samples))
  const res = await service.getElevationAlongPath({ path, samples: n })
  return (res.results ?? []).map((r) => ({
    lat: r.location?.lat() ?? 0,
    lng: r.location?.lng() ?? 0,
    elevation: r.elevation,
  }))
}

export async function sampleElevationsAtLocations(
  locations: LatLng[],
): Promise<number[]> {
  if (locations.length === 0) return []
  const service = await getService()
  const out: number[] = []
  for (let i = 0; i < locations.length; i += MAX_PER_REQUEST) {
    const chunk = locations.slice(i, i + MAX_PER_REQUEST)
    const res = await service.getElevationForLocations({ locations: chunk })
    for (const r of res.results ?? []) out.push(r.elevation)
  }
  return out
}
