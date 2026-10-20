import { formatMoney } from '../lib/currency.js'

/**
 * Small line chart of daily spending with a bubble on the latest point.
 * `points` is [{ day, amount }] oldest first; needs at least two.
 */
export function SparkChart({ points, currency }) {
  if (points.length < 2) return null
  const W = 300
  const H = 96
  const padX = 14
  const padTop = 30
  const padBottom = 12
  const max = Math.max(...points.map((p) => p.amount), 1)
  const min = Math.min(...points.map((p) => p.amount), 0)
  const span = Math.max(max - min, 1)
  const xy = points.map((p, i) => [
    padX + (i * (W - padX * 2)) / (points.length - 1),
    padTop + (1 - (p.amount - min) / span) * (H - padTop - padBottom),
  ])
  // Smooth the line through the points (Catmull-Rom converted to Bezier curves).
  let d = `M${xy[0][0]},${xy[0][1]}`
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] ?? xy[i]
    const p1 = xy[i]
    const p2 = xy[i + 1]
    const p3 = xy[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  const last = xy[xy.length - 1]
  const label = formatMoney(points[points.length - 1].amount, currency)
  const bubbleW = Math.max(56, label.length * 7.4 + 16)
  const bx = Math.min(Math.max(last[0] - bubbleW / 2, 2), W - bubbleW - 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Daily spending, latest ${label}`}>
      <path d={`${d} L${last[0]},${H} L${xy[0][0]},${H} Z`} fill="rgb(var(--c-purple) / 0.14)" />
      <path d={d} fill="none" stroke="rgb(var(--c-purple))" strokeWidth="2.4" strokeLinecap="round" />
      <line x1={last[0]} x2={last[0]} y1={last[1]} y2={H} stroke="rgb(var(--c-purple) / 0.4)" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle cx={last[0]} cy={last[1]} r="5" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-purple))" strokeWidth="2.4" />
      <rect x={bx} y="2" width={bubbleW} height="20" rx="10" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-line))" />
      <text x={bx + bubbleW / 2} y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgb(var(--c-ink))">
        {label}
      </text>
    </svg>
  )
}
