import { useMemo } from 'react'
import type { Route } from '../lib/types'

type Props = {
  routes: Route[]
  width?: number
  height?: number
}

const COLORS: Record<Route['source'], string> = {
  brouter: '#16a34a',
  google: '#2563eb',
}

type ChartLine = {
  key: string
  d: string
  color: string
  dashed: boolean
  label: string
}

export function ElevationProfile({ routes, width = 720, height = 220 }: Props) {
  const padding = { top: 12, right: 16, bottom: 24, left: 40 }

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const dims = useMemo(() => {
    let maxDist = 0
    let minElev = Infinity
    let maxElev = -Infinity
    for (const r of routes) {
      const d = r.points.at(-1)?.distanceFromStart ?? 0
      if (d > maxDist) maxDist = d
      for (const p of r.points) {
        if (p.elevation < minElev) minElev = p.elevation
        if (p.elevation > maxElev) maxElev = p.elevation
      }
      if (r.comparisonSeries) {
        for (const e of r.comparisonSeries.elevations) {
          if (e < minElev) minElev = e
          if (e > maxElev) maxElev = e
        }
      }
    }
    if (!Number.isFinite(minElev)) minElev = 0
    if (!Number.isFinite(maxElev)) maxElev = 0
    if (maxElev - minElev < 10) maxElev = minElev + 10
    return { maxDist, minElev, maxElev }
  }, [routes])

  const xScale = (m: number) => (dims.maxDist === 0 ? 0 : (m / dims.maxDist) * innerW)
  const yScale = (e: number) =>
    innerH - ((e - dims.minElev) / (dims.maxElev - dims.minElev)) * innerH

  const yTicks = [dims.minElev, (dims.minElev + dims.maxElev) / 2, dims.maxElev]
  const xTicks = [0, dims.maxDist / 2, dims.maxDist]

  const lines: ChartLine[] = useMemo(() => {
    const xs = (m: number) => (dims.maxDist === 0 ? 0 : (m / dims.maxDist) * innerW)
    const ys = (e: number) =>
      innerH - ((e - dims.minElev) / (dims.maxElev - dims.minElev)) * innerH
    const out: ChartLine[] = []
    for (const route of routes) {
      const color = COLORS[route.source]
      const primaryLabel =
        route.source === 'brouter' ? 'BRouter (SRTM)' : 'Google route (DEM)'
      out.push({
        key: `${route.source}-primary`,
        color,
        dashed: false,
        label: primaryLabel,
        d: route.points
          .map((p, i) => {
            const cmd = i === 0 ? 'M' : 'L'
            return `${cmd}${xs(p.distanceFromStart).toFixed(1)},${ys(p.elevation).toFixed(1)}`
          })
          .join(' '),
      })
      if (route.comparisonSeries) {
        const series = route.comparisonSeries
        out.push({
          key: `${route.source}-comparison`,
          color,
          dashed: true,
          label: `${route.source === 'brouter' ? 'BRouter path' : 'Google path'} · ${series.label}`,
          d: route.points
            .map((p, i) => {
              const cmd = i === 0 ? 'M' : 'L'
              const e = series.elevations[i] ?? p.elevation
              return `${cmd}${xs(p.distanceFromStart).toFixed(1)},${ys(e).toFixed(1)}`
            })
            .join(' '),
        })
      }
    }
    return out
  }, [routes, dims, innerW, innerH])

  if (routes.length === 0) return null

  return (
    <div className="elevation-profile-wrap">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="elevation-profile"
        role="img"
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#94a3b8" />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="#94a3b8" />

          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line
                x1={0}
                x2={innerW}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke="#e2e8f0"
                opacity={0.4}
              />
              <text x={-8} y={yScale(t)} textAnchor="end" dy="0.32em" fontSize="11" fill="var(--text)">
                {Math.round(t)}m
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <text
              key={`x${t}`}
              x={xScale(t)}
              y={innerH + 16}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text)"
            >
              {(t / 1000).toFixed(1)}km
            </text>
          ))}

          {lines.map((line) => (
            <path
              key={line.key}
              d={line.d}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.dashed ? '4 3' : undefined}
              opacity={line.dashed ? 0.7 : 0.95}
            />
          ))}

          <text x={0} y={-2} fontSize="11" fontWeight={600} fill="var(--text-h)">
            A · start
          </text>
          <text x={innerW} y={-2} textAnchor="end" fontSize="11" fontWeight={600} fill="var(--text-h)">
            end · B
          </text>
        </g>
      </svg>
      <ul className="elevation-legend">
        {lines.map((line) => (
          <li key={line.key}>
            <span
              className={`legend-swatch${line.dashed ? ' legend-swatch--dashed' : ''}`}
              style={{ background: line.dashed ? 'transparent' : line.color, borderColor: line.color }}
              aria-hidden
            />
            {line.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
