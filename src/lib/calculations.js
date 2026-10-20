import { computeSettlements } from './settlement.js'

export function sum(values) {
  return values.reduce((a, b) => a + b, 0)
}

/**
 * Split `amount` paise equally across `participantIds`.
 * Leftover paise go one each to the first participants in the given order,
 * so the shares always add up to exactly `amount`.
 * Returns { [memberId]: paise }.
 */
export function splitEqual(amount, participantIds) {
  const n = participantIds.length
  if (n === 0) return {}
  const base = Math.floor(amount / n)
  const extra = amount - base * n
  const out = {}
  participantIds.forEach((id, i) => {
    out[id] = base + (i < extra ? 1 : 0)
  })
  return out
}

/** Allocate in trip-member order so the result is deterministic. */
export function allocateExpense(amount, participantIds, members) {
  const chosen = new Set(participantIds)
  const ordered = members.map((m) => m.id).filter((id) => chosen.has(id))
  return splitEqual(amount, ordered)
}

/**
 * Everything derived from a trip. Nothing here is stored; it is always
 * recomputed from the saved expenses.
 */
export function computeTripStats(trip) {
  const { members, expenses } = trip
  const total = sum(expenses.map((e) => e.amount))
  const memberCount = members.length

  // Overall equal share: total split across ALL members, leftover paise deterministic.
  const overallShares = splitEqual(total, members.map((m) => m.id))

  const byId = {}
  members.forEach((m) => {
    byId[m.id] = { id: m.id, name: m.name, paid: 0, allocated: 0, equalShare: overallShares[m.id] ?? 0, balance: 0 }
  })
  expenses.forEach((e) => {
    if (byId[e.payerId]) byId[e.payerId].paid += e.amount
    Object.entries(e.allocations).forEach(([id, paise]) => {
      if (byId[id]) byId[id].allocated += paise
    })
  })
  members.forEach((m) => {
    byId[m.id].balance = byId[m.id].paid - byId[m.id].equalShare
  })

  const rows = members.map((m) => byId[m.id])
  const balances = Object.fromEntries(rows.map((r) => [r.id, r.balance]))

  return {
    total,
    expenseCount: expenses.length,
    memberCount,
    // Headline per-person figure, rounded to the nearest paisa for display.
    equalShare: memberCount ? Math.round(total / memberCount) : 0,
    rows,
    byId,
    settlements: computeSettlements(balances, members.map((m) => m.id)),
    balanceSum: sum(rows.map((r) => r.balance)),
  }
}

/** Group expenses by (case-insensitive) title for a simple breakdown. */
export function computeBreakdown(expenses, topN = 5) {
  const total = sum(expenses.map((e) => e.amount))
  const groups = new Map()
  expenses.forEach((e) => {
    const key = e.title.trim().toLowerCase()
    const g = groups.get(key) ?? { label: e.title.trim(), amount: 0, count: 0 }
    g.amount += e.amount
    g.count += 1
    groups.set(key, g)
  })
  const sorted = [...groups.values()].sort((a, b) => b.amount - a.amount)
  let items = sorted
  if (sorted.length > topN) {
    const rest = sorted.slice(topN)
    items = [
      ...sorted.slice(0, topN),
      { label: 'Others', amount: sum(rest.map((r) => r.amount)), count: sum(rest.map((r) => r.count)) },
    ]
  }
  return items.map((i) => ({ ...i, pct: total ? (i.amount / total) * 100 : 0 }))
}
