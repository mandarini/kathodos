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
  const [loading, setLoading] = useState(false)

  const swap = () => {
    setStart(end)
    setEnd(start)
  }

  const findRoute = async () => {
    if (!start || !end) return
    setLoading(true)
    setErrors([])
    setRoutes([])

    const [brouterResult, googleResult] = await Promise.allSettled([
      getBrouterRoute(start.location, end.location),
      getLowestAscentGoogleRoute(start.location, end.location, GOOGLE_MAPS_API_KEY),
    ])

    const next: Route[] = []
    const nextErrors: EngineError[] = []

    if (brouterResult.status === 'fulfilled') next.push(brouterResult.value)
    else nextErrors.push({ source: 'brouter', message: String(brouterResult.reason) })

    if (googleResult.status === 'fulfilled') next.push(googleResult.value)
    else nextErrors.push({ source: 'google', message: String(googleResult.reason) })

    setRoutes(next)
    setErrors(nextErrors)
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
