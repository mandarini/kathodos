import type { LatLng } from '../types'

export function googleMapsBicycleDirections(start: LatLng, end: LatLng): string {
  const o = `${start.lat},${start.lng}`
  const d = `${end.lat},${end.lng}`
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=bicycling`
}
