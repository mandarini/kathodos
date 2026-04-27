import { useState } from 'react'
import { PlacesAutocomplete } from './PlacesAutocomplete'
import type { Endpoint } from '../lib/types'

type Props = {
  start?: Endpoint
  end?: Endpoint
  loading: boolean
  onChangeStart: (e: Endpoint) => void
  onChangeEnd: (e: Endpoint) => void
  onSwap: () => void
  onSubmit: () => void
}

export function RoutePlannerForm({
  start,
  end,
  loading,
  onChangeStart,
  onChangeEnd,
  onSwap,
  onSubmit,
}: Props) {
  const [geoError, setGeoError] = useState<string | null>(null)

  const useMyLocation = () => {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported in this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChangeStart({
          label: 'Current location',
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        })
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const canSubmit = !!start && !!end && !loading

  return (
    <form
      className="planner-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <PlacesAutocomplete
        placeholder="Start"
        value={start}
        onSelect={onChangeStart}
      />
      <button type="button" className="link-button" onClick={useMyLocation}>
        Use my location
      </button>

      <PlacesAutocomplete
        placeholder="Destination"
        value={end}
        onSelect={onChangeEnd}
      />

      <div className="planner-actions">
        <button
          type="button"
          className="ghost-button"
          onClick={onSwap}
          disabled={!start && !end}
        >
          ⇅ Swap
        </button>
        <button type="submit" className="primary-button" disabled={!canSubmit}>
          {loading ? 'Routing…' : 'Find route'}
        </button>
      </div>
      {geoError && <div className="form-error">{geoError}</div>}
    </form>
  )
}
