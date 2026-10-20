import { computeBreakdown, computeTripStats, sum } from './calculations.js'

const pad = (n) => String(n).padStart(2, '0')
const dayKey = (ms) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Expense totals per local calendar day, oldest first, limited to the latest `maxDays` days with spending. */
export function dailyTotals(expenses, maxDays = 10) {
  const byDay = new Map()
  for (const e of expenses) {
    const key = dayKey(e.createdAt)
    const g = byDay.get(key) ?? { day: key, at: e.createdAt, amount: 0, count: 0 }
    g.amount += e.amount
    g.count += 1
    g.at = Math.min(g.at, e.createdAt)
    byDay.set(key, g)
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-maxDays)
}

/**
 * Everything the Insights screen shows for one trip. All amounts are in the
 * trip's own currency; trips are never combined.
 */
export function computeInsights(trip) {
  const stats = computeTripStats(trip)
  const count = trip.expenses.length
  const largest = count ? trip.expenses.reduce((a, b) => (b.amount > a.amount ? b : a)) : null
  const topPayer = stats.rows.filter((r) => r.paid > 0).sort((a, b) => b.paid - a.paid)[0] ?? null
  return {
    stats,
    total: stats.total,
    count,
    average: count ? Math.round(stats.total / count) : 0,
    largest: largest && { title: largest.title, amount: largest.amount },
    topPayer: topPayer && { name: topPayer.name, paid: topPayer.paid },
    categories: computeBreakdown(trip.expenses, 6),
    daily: dailyTotals(trip.expenses),
    members: stats.rows,
    paidTotal: sum(stats.rows.map((r) => r.paid)),
  }
}
