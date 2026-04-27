import type { Endpoint, Route } from '../lib/types'
import { RouteStatsCard } from './RouteStatsCard'
import { ElevationProfile } from './ElevationProfile'
import { downloadGpx } from '../lib/gpx/export'
import { googleMapsBicycleDirections } from '../lib/google/directions-link'

type Props = {
  routes: Route[]
  start: Endpoint
  end: Endpoint
}

export function RouteCompare({ routes, start, end }: Props) {
  if (routes.length === 0) return null

  const sorted = [...routes].sort((a, b) => a.ascentMeters - b.ascentMeters)
  const lowestSource = sorted[0]?.source

  const gmapsUrl = googleMapsBicycleDirections(start.location, end.location)

  return (
    <section className="route-compare">
      <ElevationProfile routes={routes} />
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
      <div className="route-compare-footer">
        <a
          className="link-button"
          href={gmapsUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          Open in Google Maps ↗
        </a>
      </div>
    </section>
  )
}
