import type { LatLng, Route } from '../types'
import { analyzeTrack } from '../elevation/analyze'
import type { RawElevPoint } from '../elevation/analyze'

const BROUTER_URL = 'https://brouter.de/brouter'

type BrouterFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'LineString'
      coordinates: Array<[number, number, number]>
    }
    properties: {
      'track-length'?: string
      'filtered ascend'?: string
      'total-time'?: string
      cost?: string
    }
  }>
}

export async function getBrouterRoute(
  start: LatLng,
  end: LatLng,
  profile: string = 'trekking',
): Promise<Route> {
  const lonlats = `${start.lng},${start.lat}|${end.lng},${end.lat}`
  const url = `${BROUTER_URL}?lonlats=${lonlats}&profile=${profile}&alternativeidx=0&format=geojson`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`BRouter request failed: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as BrouterFeatureCollection

  const feature = data.features[0]
  if (!feature) throw new Error('BRouter returned no route feature')

  const raw: RawElevPoint[] = feature.geometry.coordinates.map(
    ([lng, lat, elevation]) => ({ lat, lng, elevation: elevation ?? 0 }),
  )

  const analyzed = analyzeTrack(raw)

  const trackLength = Number(feature.properties['track-length'] ?? '0')
  const totalTime = Number(feature.properties['total-time'] ?? '0')

  return {
    source: 'brouter',
    points: analyzed.points,
    distanceMeters: trackLength || analyzed.distanceMeters,
    durationSeconds: totalTime,
    ascentMeters: analyzed.ascentMeters,
    descentMeters: analyzed.descentMeters,
  }
}
