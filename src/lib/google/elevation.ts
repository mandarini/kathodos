const ELEVATION_URL = 'https://maps.googleapis.com/maps/api/elevation/json'

const MAX_SAMPLES = 512

type ElevationResponse = {
  status: string
  error_message?: string
  results?: Array<{
    elevation: number
    location: { lat: number; lng: number }
  }>
}

export type ElevationSample = { lat: number; lng: number; elevation: number }

export async function sampleElevations(
  encodedPolyline: string,
  samples: number,
  apiKey: string,
): Promise<ElevationSample[]> {
  const n = Math.max(2, Math.min(MAX_SAMPLES, samples))
  const url = `${ELEVATION_URL}?path=enc:${encodeURIComponent(encodedPolyline)}&samples=${n}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Elevation request failed: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as ElevationResponse
  if (data.status !== 'OK') {
    throw new Error(`Elevation API error: ${data.status} ${data.error_message ?? ''}`)
  }
  return (data.results ?? []).map((r) => ({
    lat: r.location.lat,
    lng: r.location.lng,
    elevation: r.elevation,
  }))
}
