import { useState } from 'react'
import { RoutePlannerForm } from './components/RoutePlannerForm'
import { MapView } from './components/MapView'
import { RouteCompare } from './components/RouteCompare'
import { getBrouterRoute } from './lib/brouter/client'
import { getLowestAscentGoogleRoute } from './lib/google/routes'
import { GOOGLE_MAPS_API_KEY } from './config'
import type { Endpoint, Route } from './lib/types'
import './App.css'

type EngineError = { source: Route['source']; message: string }

function App() {
  const [start, setStart] = useState<Endpoint | undefined>()
  const [end, setEnd] = useState<Endpoint | undefined>()
  const [routes, setRoutes] = useState<Route[]>([])
  const [errors, setErrors] = useState<EngineError[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const swap = () => {
    setStart(end)
    setEnd(start)
  }

  const findRoute = async () => {
    if (!start || !end) return
    setLoading(true)
    setErrors([])
    setNotes([])
    setRoutes([])

    const [brouterResult, googleResult] = await Promise.allSettled([
      getBrouterRoute(start.location, end.location, {
        googleElevationApiKey: GOOGLE_MAPS_API_KEY,
      }),
      getLowestAscentGoogleRoute(start.location, end.location, GOOGLE_MAPS_API_KEY),
    ])

    const next: Route[] = []
    const nextErrors: EngineError[] = []
    const nextNotes: string[] = []

    if (brouterResult.status === 'fulfilled') next.push(brouterResult.value)
    else nextErrors.push({ source: 'brouter', message: String(brouterResult.reason) })

    if (googleResult.status === 'fulfilled') {
      if (googleResult.value) {
        next.push(googleResult.value)
        if (googleResult.value.googleMode && googleResult.value.googleMode !== 'BICYCLE') {
          nextNotes.push(
            `Google has no bicycle data here — using its ${googleResult.value.googleMode.toLowerCase()} network as a fallback.`,
          )
        }
      } else {
        nextNotes.push('Google has no route data for this area — showing BRouter only.')
      }
    } else {
      nextErrors.push({ source: 'google', message: String(googleResult.reason) })
    }

    setRoutes(next)
    setErrors(nextErrors)
    setNotes(nextNotes)
    setLoading(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>kathodos</h1>
        <p>Bike routes that go around hills, not over them.</p>
      </header>

      <aside className="app-sidebar">
        <RoutePlannerForm
          start={start}
          end={end}
          loading={loading}
          onChangeStart={setStart}
          onChangeEnd={setEnd}
          onSwap={swap}
          onSubmit={findRoute}
        />
        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((e) => (
              <div key={e.source} className="form-error">
                <strong>{e.source}:</strong> {e.message}
              </div>
            ))}
          </div>
        )}
        {notes.length > 0 && (
          <div className="form-notes">
            {notes.map((n, i) => (
              <div key={i} className="form-note">{n}</div>
            ))}
          </div>
        )}
        {routes.length > 0 && start && end && (
          <RouteCompare routes={routes} start={start} end={end} />
        )}
      </aside>

      <main className="app-map">
        <MapView
          start={start?.location}
          end={end?.location}
          routes={routes}
        />
      </main>
    </div>
  )
}

export default App
