import { beforeEach, describe, expect, it } from 'vitest'
import { buildActivity, recentExpenses } from './activity.js'
import { computeInsights, dailyTotals } from './insights.js'
import { addMember, createExpense, createTrip, markMemberLeft, removeExpense } from './model.js'
import { loadTrips, sanitizeTrip, saveTrips } from './storage.js'

class MemoryStorage {
  map = new Map()
  get length() {
    return this.map.size
  }
  key(i) {
    return [...this.map.keys()][i] ?? null
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null
  }
  setItem(k, v) {
    this.map.set(k, String(v))
  }
  removeItem(k) {
    this.map.delete(k)
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

const T0 = 10_000_000
const R = (n) => n * 100

function scenario() {
  let trip = createTrip({ name: 'Trek', currencyCode: 'USD', memberNames: ['Muhsin', 'Niyas'] })
  trip.createdAt = T0
  trip.members.forEach((m) => (m.joinedAt = T0))
  const [m, n] = trip.members.map((x) => x.id)
  trip.expenses.push(createExpense(trip, { title: 'Stay', category: 'Hotel', amount: R(100), payerId: m, participantIds: [m, n] }, T0 + 10_000))
  trip.expenses.push(createExpense(trip, { title: 'Food', category: 'Food', amount: R(40), payerId: n, participantIds: [m, n] }, T0 + 20_000))
  trip = addMember(trip, 'Rafi', T0 + 30_000)
  return { trip, m, n }
}

describe('activity feed', () => {
  it('lists real events newest first', () => {
    const { trip, n } = scenario()
    const left = markMemberLeft(trip, n, T0 + 40_000)
    const types = buildActivity([left]).map((e) => e.type)
    expect(types).toEqual(['member_left', 'member_joined', 'expense_added', 'expense_added', 'trip_created'])
  })

  it('shows an edit only when the expense was changed later', () => {
    const { trip } = scenario()
    expect(buildActivity([trip]).some((e) => e.type === 'expense_edited')).toBe(false)
    trip.expenses[0] = { ...trip.expenses[0], updatedAt: T0 + 50_000 }
    const edited = buildActivity([trip]).find((e) => e.type === 'expense_edited')
    expect(edited).toMatchObject({ title: 'Stay', at: T0 + 50_000, amount: R(100) })
  })

  it('records deletions and keeps them through save and load', () => {
    const { trip } = scenario()
    const after = removeExpense(trip, trip.expenses[0].id, T0 + 60_000)
    expect(after.expenses).toHaveLength(1)
    expect(after.removedExpenses).toEqual([{ id: trip.expenses[0].id, title: 'Stay', amount: R(100), paidBy: 'Muhsin', at: T0 + 60_000 }])
    const del = buildActivity([after])[0]
    expect(del).toMatchObject({ type: 'expense_deleted', title: 'Stay', who: 'Muhsin', amount: R(100) })
    saveTrips([after])
    expect(loadTrips().trips[0].removedExpenses).toHaveLength(1)
  })

  it('removing something that does not exist changes nothing', () => {
    const { trip } = scenario()
    expect(removeExpense(trip, 'nope')).toBe(trip)
  })

  it('caps the deletion log and repairs bad entries', () => {
    const { trip } = scenario()
    const bad = { ...trip, removedExpenses: [{ id: 'x' }, null, { id: 'y', title: 'a', amount: 5, at: 5 }] }
    expect(sanitizeTrip(bad).removedExpenses.map((d) => d.id)).toEqual(['y'])
    let t = trip
    for (let i = 0; i < 60; i++) {
      t = { ...t, expenses: [...t.expenses, { ...trip.expenses[0], id: `e${i}` }] }
      t = removeExpense(t, `e${i}`, T0 + 100_000 + i)
    }
    expect(t.removedExpenses).toHaveLength(50)
  })

  it('filters by trip and limits, and never mixes trips', () => {
    const a = scenario().trip
    const b = createTrip({ name: 'Other', memberNames: ['A', 'B'] })
    expect(buildActivity([a, b], { tripId: b.id }).every((e) => e.tripId === b.id)).toBe(true)
    expect(buildActivity([a, b], { limit: 2 })).toHaveLength(2)
    const recent = recentExpenses([a, b], 5)
    expect(recent.map((e) => e.title)).toEqual(['Food', 'Stay'])
    expect(recent[0].currencyCode).toBe('USD')
  })

  it('marks completion', () => {
    const { trip } = scenario()
    const done = { ...trip, status: 'completed', completedAt: T0 + 70_000 }
    expect(buildActivity([done])[0]).toMatchObject({ type: 'trip_completed', at: T0 + 70_000 })
  })
})

describe('insights', () => {
  it('summarises one trip in its own currency', () => {
    const { trip } = scenario()
    const i = computeInsights(trip)
    expect(i.total).toBe(R(140))
    expect(i.count).toBe(2)
    expect(i.average).toBe(R(70))
    expect(i.largest).toEqual({ title: 'Stay', amount: R(100) })
    expect(i.topPayer).toEqual({ name: 'Muhsin', paid: R(100) })
    expect(i.categories.map((c) => c.label)).toEqual(['Hotel', 'Food'])
    expect(i.paidTotal).toBe(i.total)
    expect(i.stats.balanceSum).toBe(0)
  })

  it('handles an empty trip', () => {
    const t = createTrip({ name: 'Empty', memberNames: ['A', 'B'] })
    const i = computeInsights(t)
    expect(i).toMatchObject({ total: 0, count: 0, average: 0, largest: null, topPayer: null, categories: [], daily: [] })
  })

  it('groups daily totals by local day, oldest first and limited', () => {
    const day = 24 * 3600 * 1000
    const base = new Date(2026, 0, 10, 12).getTime()
    const exp = (i, amount) => ({ createdAt: base + i * day, amount })
    const rows = dailyTotals([exp(2, 5), exp(0, 10), exp(0, 20), exp(1, 7)])
    expect(rows.map((r) => r.amount)).toEqual([30, 7, 5])
    expect(rows[0].count).toBe(2)
    expect(dailyTotals(Array.from({ length: 30 }, (_, i) => exp(i, 1)), 10)).toHaveLength(10)
  })
})
