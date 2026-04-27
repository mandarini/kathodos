import type { Route } from '../lib/types'
import { RouteStatsCard } from './RouteStatsCard'
import { ElevationProfile } from './ElevationProfile'
import { downloadGpx } from '../lib/gpx/export'

type Props = {
  routes: Route[]
}

export function RouteCompare({ routes }: Props) {
  if (routes.length === 0) return null

  const sorted = [...routes].sort((a, b) => a.ascentMeters - b.ascentMeters)
  const lowestSource = sorted[0]?.source

  return (
    <section className="route-compare">
      <ElevationProfile routes={routes} />
      <p className="route-compare-hint">
        Download a GPX and import it into Strava, Komoot, RideWithGPS, Garmin Connect, or any GPX-aware app.
      </p>
      <div className="route-compare-grid">
        {routes.map((route) => (
          <RouteStatsCard
            key={route.source}
            route={route}
            highlight={route.source === lowestSource}
          >
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                downloadGpx(route, `kathodos-${route.source}-${Date.now()}`)
              }
            >
              Download GPX
            </button>
          </RouteStatsCard>
        ))}
      </div>
    </section>
  )
}
