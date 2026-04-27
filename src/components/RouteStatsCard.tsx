import type { Route } from '../lib/types'

const LABELS: Record<Route['source'], string> = {
  brouter: 'BRouter (least climb)',
  google: 'Google (default)',
}

const COLORS: Record<Route['source'], string> = {
  brouter: '#16a34a',
  google: '#2563eb',
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}h ${rem}m`
}

type Props = {
  route: Route
  highlight?: boolean
  children?: React.ReactNode
}

export function RouteStatsCard({ route, highlight, children }: Props) {
  return (
    <div className={`route-stats-card${highlight ? ' route-stats-card--highlight' : ''}`}>
      <div className="route-stats-header">
        <span
          className="route-stats-swatch"
          style={{ background: COLORS[route.source] }}
          aria-hidden
        />
        <h3>{LABELS[route.source]}</h3>
      </div>
      <dl className="route-stats-grid">
        <div>
          <dt>Distance</dt>
          <dd>{(route.distanceMeters / 1000).toFixed(2)} km</dd>
        </div>
        <div>
          <dt>Climb (ascent)</dt>
          <dd>{Math.round(route.ascentMeters)} m</dd>
        </div>
        <div>
          <dt>Descent</dt>
          <dd>{Math.round(route.descentMeters)} m</dd>
        </div>
        <div>
          <dt>ETA</dt>
          <dd>{formatDuration(route.durationSeconds)}</dd>
        </div>
      </dl>
      {children && <div className="route-stats-actions">{children}</div>}
    </div>
  )
}
