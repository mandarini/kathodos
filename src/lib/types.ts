export type LatLng = { lat: number; lng: number }

export type RoutePoint = {
  lat: number
  lng: number
  elevation: number
  distanceFromStart: number
}

export type RouteSource = 'brouter' | 'google'

export type Route = {
  source: RouteSource
  points: RoutePoint[]
  distanceMeters: number
  durationSeconds: number
  ascentMeters: number
  descentMeters: number
}

export type Endpoint = {
  label: string
  location: LatLng
}
