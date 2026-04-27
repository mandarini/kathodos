import { useEffect, useRef } from 'react'
import { loadMaps } from '../lib/google/loader'
import { ATHENS_CENTER } from '../config'
import type { LatLng, Route } from '../lib/types'

type Props = {
  start?: LatLng
  end?: LatLng
  routes: Route[]
}

const ROUTE_COLORS: Record<Route['source'], string> = {
  brouter: '#16a34a',
  google: '#2563eb',
}

export function MapView({ start, end, routes }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const maps = await loadMaps()
      if (cancelled || !containerRef.current || mapRef.current) return
      mapRef.current = new maps.Map(containerRef.current, {
        center: ATHENS_CENTER,
        zoom: 13,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    polylinesRef.current.forEach((p) => p.setMap(null))
    polylinesRef.current = []
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (start) {
      markersRef.current.push(
        new google.maps.Marker({ position: start, map, label: 'A' }),
      )
    }
    if (end) {
      markersRef.current.push(
        new google.maps.Marker({ position: end, map, label: 'B' }),
      )
    }

    for (const route of routes) {
      const path = route.points.map((p) => ({ lat: p.lat, lng: p.lng }))
      const line = new google.maps.Polyline({
        path,
        map,
        strokeColor: ROUTE_COLORS[route.source],
        strokeWeight: route.source === 'brouter' ? 5 : 4,
        strokeOpacity: 0.85,
      })
      polylinesRef.current.push(line)
    }

    const bounds = new google.maps.LatLngBounds()
    let hasPoint = false
    if (start) {
      bounds.extend(start)
      hasPoint = true
    }
    if (end) {
      bounds.extend(end)
      hasPoint = true
    }
    for (const route of routes) {
      for (const p of route.points) {
        bounds.extend({ lat: p.lat, lng: p.lng })
        hasPoint = true
      }
    }
    if (hasPoint && !bounds.isEmpty()) {
      map.fitBounds(bounds, 60)
    }
  }, [start, end, routes])

  return <div ref={containerRef} className="map-canvas" />
}
