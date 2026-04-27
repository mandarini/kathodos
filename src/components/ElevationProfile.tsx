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

export function ElevationProfile({ routes, width = 720, height = 200 }: Props) {
  const padding = { top: 12, right: 16, bottom: 24, left: 40 }

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
    }
    if (!Number.isFinite(minElev)) minElev = 0
    if (!Number.isFinite(maxElev)) maxElev = 0
    if (maxElev - minElev < 10) maxElev = minElev + 10
    return { maxDist, minElev, maxElev }
  }, [routes])

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const xScale = (m: number) => (dims.maxDist === 0 ? 0 : (m / dims.maxDist) * innerW)
  const yScale = (e: number) =>
    innerH - ((e - dims.minElev) / (dims.maxElev - dims.minElev)) * innerH

  const yTicks = [dims.minElev, (dims.minElev + dims.maxElev) / 2, dims.maxElev]
  const xTicks = [0, dims.maxDist / 2, dims.maxDist]

  if (routes.length === 0) return null

  return (
    <svg width={width} height={height} className="elevation-profile" role="img">
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
            />
            <text x={-8} y={yScale(t)} textAnchor="end" dy="0.32em" fontSize="11" fill="#64748b">
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
            fill="#64748b"
          >
            {(t / 1000).toFixed(1)}km
          </text>
        ))}

        {routes.map((route) => {
          const d = route.points
            .map((p, i) => {
              const cmd = i === 0 ? 'M' : 'L'
              return `${cmd}${xScale(p.distanceFromStart).toFixed(1)},${yScale(p.elevation).toFixed(1)}`
            })
            .join(' ')
          return (
            <path
              key={route.source}
              d={d}
              fill="none"
              stroke={COLORS[route.source]}
              strokeWidth={2}
              opacity={0.9}
            />
          )
        })}
      </g>
    </svg>
  )
}
