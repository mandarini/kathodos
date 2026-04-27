import { useEffect, useRef } from 'react'
import { loadPlaces } from '../lib/google/loader'
import type { Endpoint } from '../lib/types'

type Props = {
  placeholder: string
  value?: Endpoint
  onSelect: (endpoint: Endpoint) => void
  regionCodes?: string[]
}

export function PlacesAutocomplete({
  placeholder,
  value,
  onSelect,
  regionCodes = ['gr'],
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadPlaces()
      if (cancelled || !containerRef.current || elementRef.current) return

      const el = new google.maps.places.PlaceAutocompleteElement({
        includedRegionCodes: regionCodes,
      })
      el.style.width = '100%'
      containerRef.current.appendChild(el)
      elementRef.current = el

      el.addEventListener('gmp-select', async (event: Event) => {
        const e = event as unknown as {
          placePrediction: { toPlace: () => google.maps.places.Place }
        }
        const place = e.placePrediction.toPlace()
        await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] })
        const loc = place.location
        if (!loc) return
        onSelect({
          label: place.formattedAddress || place.displayName || 'Selected place',
          location: { lat: loc.lat(), lng: loc.lng() },
        })
      })
    })()
    return () => {
      cancelled = true
    }
  }, [onSelect, regionCodes])

  return (
    <div className="places-autocomplete">
      <label className="places-label">{placeholder}</label>
      <div ref={containerRef} className="places-input-host" />
      {value && <div className="places-value-hint">{value.label}</div>}
    </div>
  )
}
