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
        <img className="app-header-logo" src="/logo.png" alt="" width="36" height="36" />
        <h1>kathodos</h1>
        <p>Bike routes that go around hills, not over them.</p>
        <a
          className="app-header-repo"
          href="https://github.com/mandarini/kathodos"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub repository"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.27-1.7-1.27-1.7-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.71 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.19a10.95 10.95 0 0 1 5.76 0c2.2-1.5 3.16-1.19 3.16-1.19.62 1.58.23 2.75.11 3.04.74.81 1.18 1.85 1.18 3.11 0 4.44-2.7 5.42-5.27 5.7.41.36.78 1.05.78 2.13v3.16c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5Z"
            />
          </svg>
          <span>GitHub</span>
        </a>
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
        {routes.length > 0 && (
          <RouteCompare routes={routes} />
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
