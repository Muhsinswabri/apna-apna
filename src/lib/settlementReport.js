import { computeTripStats } from './calculations.js'
import { formatMoney, formatSignedMoney } from './currency.js'
import { resolveCurrency } from './currencies.js'
import { formatDate } from './dates.js'
import { safeFileName } from './exporters.js'

/** "To Receive" / "To Pay" / "Settled" for a balance in minor units. */
export function balanceStatus(balance) {
  if (balance > 0) return { key: 'receive', label: 'To Receive' }
  if (balance < 0) return { key: 'pay', label: 'To Pay' }
  return { key: 'settled', label: 'Settled' }
}

/**
 * The trip's date range as text, from the earliest saved date to the completion date (or the last
 * recorded expense while the trip is ongoing). Uses only saved data, never "now".
 */
export function tripPeriod(trip) {
  const starts = [trip.createdAt, ...trip.expenses.map((e) => e.createdAt)].filter(Number.isFinite)
  if (!starts.length) return ''
  const first = Math.min(...starts)
  const lastExpense = trip.expenses.reduce((m, e) => Math.max(m, e.createdAt || 0), 0)
  const last = trip.status === 'completed' && trip.completedAt ? trip.completedAt : lastExpense || first
  const a = formatDate(first)
  const b = formatDate(Math.max(first, last))
  return a === b ? a : `${a} – ${b}`
}

/**
 * Everything the exported settlement document shows, as plain data with money already formatted in
 * the trip's currency. Built from the same computeTripStats as the on-screen Current Status and
 * Final Settlement, so the numbers cannot drift from what the user sees.
 */
export function buildSettlementReport(trip, stats = computeTripStats(trip), now = Date.now()) {
  const code = trip.currencyCode
  const currency = resolveCurrency(code)
  const money = (n) => formatMoney(n, code)
  const completed = trip.status === 'completed'
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const pick = (id) => {
    const r = stats.byId[id]
    return r ? { id: r.id, name: r.name, avatarId: r.avatarId } : { id, name: 'Unknown', avatarId: null }
  }

  return {
    title: completed ? 'Final Settlement' : 'Current Status',
    completed,
    tripName: trip.name,
    imageCategory: trip.imageCategory,
    period: tripPeriod(trip),
    currencyCode: code,
    currencyName: currency.name,
    total: money(stats.total),
    expenseCount: stats.expenseCount,
    memberCount: stats.memberCount,
    paymentCount: stats.settlements.length,
    members: stats.rows.map((r) => ({
      ...pick(r.id),
      active: r.active,
      paid: money(r.paid),
      allocated: money(r.allocated),
      balance: formatSignedMoney(r.balance, code),
      balanceMinor: r.balance,
      status: balanceStatus(r.balance),
    })),
    transactions: stats.settlements.map((s) => ({
      from: pick(s.from),
      to: pick(s.to),
      amount: money(s.amount),
      text: `${nameOf(s.from)} pays ${nameOf(s.to)} ${money(s.amount)}`,
    })),
    generatedOn: formatDate(now),
    fileBase: `ApnaApna-${safeFileName(trip.name)}-Settlement`,
  }
}

export const fileNameFor = (report, format) => `${report.fileBase}.${format}`
