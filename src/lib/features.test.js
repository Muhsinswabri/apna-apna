import { beforeEach, describe, expect, it } from 'vitest'
import { computeTripStats } from './calculations.js'
import { CURRENCIES, getCurrency, searchCurrencies } from './currencies.js'
import { formatMoney, formatSignedMoney, maxMinor, minorToInput, minorToPlain, toMinor } from './currency.js'
import { canRejoin, eligibleAt } from './members.js'
import { addMember, createExpense, createTrip, editExpense, eligibleForExpense, markMemberLeft, rejoinMember } from './model.js'
import { STORAGE_KEY, loadTrips, sanitizeTrip, saveTrips } from './storage.js'
import { nameKey, normalizeName, toTitleCase } from './text.js'
import { tripToCsv } from './exporters.js'
import { validateExpense, validateMemberName } from './validation.js'

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

const R = (n) => n * 100
const sum = (a) => a.reduce((x, y) => x + y, 0)

describe('Title Case', () => {
  it('capitalises every word', () => {
    expect(toTitleCase('wayanad trip')).toBe('Wayanad Trip')
    expect(toTitleCase('muhsin swabri')).toBe('Muhsin Swabri')
    expect(toTitleCase('hotel room booking')).toBe('Hotel Room Booking')
    expect(toTitleCase('food and accommodation')).toBe('Food And Accommodation')
  })
  it('keeps spacing while typing and does not touch the rest of a word', () => {
    expect(toTitleCase('wayanad ')).toBe('Wayanad ')
    expect(toTitleCase('a  b')).toBe('A  B')
    expect(toTitleCase('NASA trip')).toBe('NASA Trip')
    expect(toTitleCase('')).toBe('')
  })
  it('handles non-latin letters and digits', () => {
    expect(toTitleCase('émile zola')).toBe('Émile Zola')
    expect(toTitleCase('3 days trip')).toBe('3 Days Trip')
  })
  it('normalizeName trims and collapses spaces', () => {
    expect(normalizeName('  muhsin    swabri ')).toBe('Muhsin Swabri')
  })
  it('duplicate detection ignores case and spacing', () => {
    expect(nameKey('MUHSIN')).toBe(nameKey(' muhsin '))
    expect(validateMemberName('muhsin', ['Muhsin', 'Niyas'])).toBeTruthy()
    expect(validateMemberName('Rafi', ['Muhsin', 'Niyas'])).toBeNull()
  })
  it('is stored title-cased by createTrip / createExpense', () => {
    const t = createTrip({ name: 'wayanad trip', memberNames: ['muhsin swabri', 'niyas'] })
    expect(t.name).toBe('Wayanad Trip')
    expect(t.members[0].name).toBe('Muhsin Swabri')
    const e = createExpense(t, { title: 'hotel room', category: 'food and drink', amount: 100, payerId: t.members[0].id, participantIds: [t.members[0].id] })
    expect(e.title).toBe('Hotel Room')
    expect(e.category).toBe('Food And Drink')
  })
})

describe('currencies', () => {
  it('has the required currencies with symbols', () => {
    for (const code of ['INR', 'USD', 'AED', 'SAR', 'GBP', 'EUR']) expect(getCurrency(code)).toBeTruthy()
    expect(getCurrency('AED').symbol).toBe('د.إ')
    expect(getCurrency('SAR').symbol).toBe('ر.س')
    expect(new Set(CURRENCIES.map((c) => c.code)).size).toBe(CURRENCIES.length)
  })
  it('searches by name, code and symbol', () => {
    expect(searchCurrencies('rupee')[0].code).toBe('INR')
    expect(searchCurrencies('usd')[0].code).toBe('USD')
    expect(searchCurrencies('₹')[0].code).toBe('INR')
    expect(searchCurrencies('د.إ')[0].code).toBe('AED')
    expect(searchCurrencies('pound').map((c) => c.code)).toContain('GBP')
    expect(searchCurrencies('  EURO ')[0].code).toBe('EUR')
    expect(searchCurrencies('zzzz')).toEqual([])
    expect(searchCurrencies('')).toHaveLength(CURRENCIES.length)
  })
  it('respects each currency precision', () => {
    expect(toMinor('10.5', 'USD')).toBe(1050)
    expect(toMinor('10.555', 'USD')).toBeNull()
    expect(toMinor('1.234', 'KWD')).toBe(1234)
    expect(toMinor('1.2345', 'KWD')).toBeNull()
    expect(toMinor('500', 'JPY')).toBe(500)
    expect(toMinor('500.5', 'JPY')).toBeNull()
    // Arabic-script symbols are wrapped in an LTR isolate so digits keep their order.
    const [LRI, PDI, LRM, NBSP] = [0x2066, 0x2069, 0x200e, 0xa0].map((c) => String.fromCharCode(c))
    expect(formatMoney(1250, 'KWD')).toBe(`${LRI}د.ك${LRM}${NBSP}1.250${PDI}`)
    expect(formatSignedMoney(-5000, 'AED')).toBe(`${LRI}−د.إ${LRM}${NBSP}50${PDI}`)
    expect(formatMoney(5000, 'CHF')).toBe(`CHF${NBSP}50`)
    expect(formatMoney(5000, 'IDR')).toBe(`Rp${NBSP}50`)
    expect(formatMoney(500, 'JPY')).toBe('¥500')
    expect(formatMoney(150050, 'USD')).toBe('$1,500.50')
    expect(formatMoney(150000, 'USD')).toBe('$1,500')
    expect(formatMoney(12500000, 'INR')).toBe('₹1,25,000')
    expect(formatSignedMoney(-1050, 'EUR')).toBe('−€10.50')
    expect(formatSignedMoney(0, 'GBP')).toBe('£0')
    expect(minorToPlain(1050, 'USD')).toBe('10.50')
    expect(minorToPlain(1250, 'KWD')).toBe('1.250')
    expect(minorToPlain(500, 'JPY')).toBe('500')
    expect(minorToInput(1050, 'USD')).toBe('10.5')
    expect(minorToInput(100000, 'INR')).toBe('1000')
    expect(minorToInput(500, 'JPY')).toBe('500')
    expect(minorToInput(1200, 'KWD')).toBe('1.2')
    expect(maxMinor('JPY')).toBe(100_000_000)
  })
  it('keeps the trip currency through save and load, and defaults older trips to INR', () => {
    const t = createTrip({ name: 'Dubai', currencyCode: 'AED', memberNames: ['A', 'B'] })
    saveTrips([t])
    expect(loadTrips().trips[0].currencyCode).toBe('AED')
    expect(sanitizeTrip({ ...t, currencyCode: undefined }).currencyCode).toBe('INR')
    expect(sanitizeTrip({ ...t, currencyCode: 'NOPE' }).currencyCode).toBe('INR')
  })
  it('exports with the trip currency', () => {
    const t = createTrip({ name: 'Dubai', currencyCode: 'USD', memberNames: ['A', 'B'] })
    t.expenses.push(createExpense(t, { title: 'Taxi', amount: 1050, payerId: t.members[0].id, participantIds: t.members.map((m) => m.id) }))
    const csv = tripToCsv(t, computeTripStats(t))
    expect(csv).toContain('Currency,USD')
    expect(csv).toContain('Amount (USD)')
    expect(csv).toContain('10.50')
  })
})

describe('members joining and leaving', () => {
  const T0 = 1_000_000

  function twoThenThree() {
    const trip = createTrip({ name: 'Trek', memberNames: ['Muhsin', 'Niyas'] })
    trip.createdAt = T0
    trip.members.forEach((m) => (m.joinedAt = T0))
    const [m, n] = trip.members.map((x) => x.id)
    trip.expenses.push(createExpense(trip, { title: 'Stay', amount: R(1200), payerId: m, participantIds: [m, n] }, T0 + 10))
    trip.expenses.push(createExpense(trip, { title: 'Food', amount: R(800), payerId: n, participantIds: [m, n] }, T0 + 20))
    const withRafi = addMember(trip, 'rafi', T0 + 100)
    return { trip: withRafi, m, n, r: withRafi.members[2].id }
  }

  it('a new member is added with a join time and never shares earlier expenses', () => {
    const { trip, r } = twoThenThree()
    expect(trip.members[2]).toMatchObject({ name: 'Rafi', joinedAt: T0 + 100, leftAt: null, status: 'active' })
    const s = computeTripStats(trip)
    expect(s.byId[r]).toMatchObject({ paid: 0, allocated: 0, balance: 0 })
    expect(s.total).toBe(R(2000))
  })

  it('shares only later expenses, per the brief example', () => {
    const { trip, m, n, r } = twoThenThree()
    trip.expenses.push(createExpense(trip, { title: 'Dinner', amount: R(3000), payerId: m, participantIds: [m, n, r] }, T0 + 200))
    const s = computeTripStats(trip)
    expect(trip.expenses[2].allocations).toEqual({ [m]: R(1000), [n]: R(1000), [r]: R(1000) })
    expect(s.byId[r].allocated).toBe(R(1000))
    // earlier expenses still only involve m and n
    expect(trip.expenses[0].allocations[r]).toBeUndefined()
    expect(trip.expenses[1].allocations[r]).toBeUndefined()
    expect(s.balanceSum).toBe(0)
    expect(s.activeCount).toBe(3)
    expect(s.equalShareMeaningful).toBe(false) // someone joined late
  })

  it('rejects duplicate names when adding, including departed members', () => {
    const { trip, n } = twoThenThree()
    expect(() => addMember(trip, ' MUHSIN ')).toThrow()
    const left = markMemberLeft(trip, n, T0 + 150)
    expect(() => addMember(left, 'niyas')).toThrow()
  })

  it('a new member cannot be put on an expense that predates them', () => {
    const { trip, m, r } = twoThenThree()
    expect(() => createExpense(trip, { title: 'X', amount: 100, payerId: m, participantIds: [m, r] }, T0 + 50)).toThrow()
    expect(() => editExpense(trip, trip.expenses[0], { title: 'Stay', amount: R(1200), payerId: m, participantIds: [m, r] })).toThrow()
    expect(eligibleForExpense(trip, trip.expenses[0]).map((x) => x.id)).not.toContain(r)
  })

  it('a departed member keeps history and balance but gets nothing new', () => {
    const { trip, m, n, r } = twoThenThree()
    trip.expenses.push(createExpense(trip, { title: 'Dinner', amount: R(3000), payerId: m, participantIds: [m, n, r] }, T0 + 200))
    const left = markMemberLeft(trip, n, T0 + 300)
    expect(left.members[1]).toMatchObject({ leftAt: T0 + 300, status: 'left' })
    const before = computeTripStats(trip).byId[n]
    const after = computeTripStats(left).byId[n]
    expect(after).toMatchObject({ paid: before.paid, allocated: before.allocated, balance: before.balance, active: false })
    // not selectable for new expenses
    expect(eligibleAt(left, T0 + 400).map((x) => x.id)).toEqual([m, r])
    expect(() => createExpense(left, { title: 'Late', amount: 100, payerId: n, participantIds: [n] }, T0 + 400)).toThrow()
    expect(() => createExpense(left, { title: 'Late', amount: 100, payerId: m, participantIds: [m, n] }, T0 + 400)).toThrow()
    left.expenses.push(createExpense(left, { title: 'Late', amount: R(100), payerId: m, participantIds: [m, r] }, T0 + 400))
    const s = computeTripStats(left)
    expect(s.byId[n].allocated).toBe(before.allocated)
    expect(s.leftCount).toBe(1)
    expect(s.balanceSum).toBe(0)
    // the departed member still appears in the settlement if they owe or are owed
    const involved = new Set(s.settlements.flatMap((x) => [x.from, x.to]))
    expect(involved.has(n)).toBe(s.byId[n].balance !== 0)
  })

  it('a departed member can still be edited on expenses from before they left', () => {
    const { trip, m, n } = twoThenThree()
    const left = markMemberLeft(trip, n, T0 + 300)
    const edited = editExpense(left, left.expenses[0], { title: 'Stay', amount: R(1000), payerId: m, participantIds: [m, n] })
    expect(edited.allocations).toEqual({ [m]: R(500), [n]: R(500) })
    expect(edited.createdAt).toBe(left.expenses[0].createdAt)
    expect(edited.id).toBe(left.expenses[0].id)
  })

  it('cannot remove the last active member', () => {
    const { trip, m, n } = twoThenThree()
    const t1 = markMemberLeft(markMemberLeft(trip, m, T0 + 200), n, T0 + 210)
    expect(t1.members.filter((x) => !x.leftAt)).toHaveLength(1)
    expect(() => markMemberLeft(t1, t1.members[2].id)).toThrow()
  })

  it('rejoin is allowed only while nothing was recorded since leaving', () => {
    const { trip, n } = twoThenThree()
    const left = markMemberLeft(trip, n, T0 + 300)
    expect(canRejoin(left, left.members[1])).toBe(true)
    expect(rejoinMember(left, n).members[1]).toMatchObject({ leftAt: null, status: 'active' })
    left.expenses.push(createExpense(left, { title: 'After', amount: 100, payerId: left.members[0].id, participantIds: [left.members[0].id] }, T0 + 400))
    expect(canRejoin(left, left.members[1])).toBe(false)
  })

  it('persists the timeline', () => {
    const { trip, n } = twoThenThree()
    const left = markMemberLeft(trip, n, T0 + 300)
    saveTrips([left])
    expect(loadTrips().trips[0]).toEqual(left)
  })

  it('unequal splits still add up exactly', () => {
    const { trip, m, n, r } = twoThenThree()
    trip.expenses.push(createExpense(trip, { title: 'Odd', amount: 1000, payerId: r, participantIds: [m, n, r] }, T0 + 200))
    expect(sum(Object.values(trip.expenses[2].allocations))).toBe(1000)
    expect(computeTripStats(trip).balanceSum).toBe(0)
  })
})

describe('current status and final settlement agree', () => {
  it('uses one calculation regardless of trip status', () => {
    const trip = createTrip({ name: 'X', memberNames: ['A', 'B', 'C'] })
    const [a, b, c] = trip.members.map((x) => x.id)
    trip.expenses.push(createExpense(trip, { title: 'One', amount: R(900), payerId: a, participantIds: [b, c] }))
    trip.expenses.push(createExpense(trip, { title: 'Two', amount: 1001, payerId: b, participantIds: [a, b, c] }))
    const live = computeTripStats(trip)
    const done = computeTripStats({ ...trip, status: 'completed', completedAt: Date.now() })
    expect(done.rows).toEqual(live.rows)
    expect(done.settlements).toEqual(live.settlements)
    expect(live.balanceSum).toBe(0)
    // nobody is charged for an expense they were not part of
    expect(trip.expenses[0].allocations[a]).toBeUndefined()
  })
})

describe('v1 to v2 migration', () => {
  const v1Trip = {
    id: 't1',
    name: 'goa trip',
    createdAt: 5000,
    updatedAt: 9000,
    status: 'completed',
    completedAt: 9000,
    members: [
      { id: 'm1', name: 'muhsin', createdAt: 5000 },
      { id: 'm2', name: 'niyas', createdAt: 5000 },
    ],
    expenses: [
      { id: 'e1', title: 'hotel', amount: 100001, payerId: 'm1', participantIds: ['m1', 'm2'], allocations: { m1: 50001, m2: 50000 }, createdAt: 6000, updatedAt: 6000 },
      { id: 'e2', title: 'fuel', amount: 3000, payerId: 'm2', participantIds: ['m1', 'm2'], createdAt: 7000, updatedAt: 7000 },
    ],
  }

  it('fills new fields, keeps ids and allocations, and backs the original up', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, trips: [v1Trip] }))
    const { trips, status } = loadTrips()
    expect(status).toBe('ok')
    const t = trips[0]
    expect(t.currencyCode).toBe('INR')
    expect(t.status).toBe('completed')
    expect(t.members.map((m) => m.id)).toEqual(['m1', 'm2'])
    expect(t.members[0]).toMatchObject({ joinedAt: 5000, leftAt: null, status: 'active' })
    expect(t.name).toBe('Goa Trip')
    expect(t.expenses[0].allocations).toEqual({ m1: 50001, m2: 50000 })
    expect(t.expenses[0].category).toBe('')
    expect(t.expenses[1].allocations).toEqual({ m1: 1500, m2: 1500 }) // rebuilt
    const backups = [...localStorage.map.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}_v1_`))
    expect(backups).toHaveLength(1)
    loadTrips()
    expect([...localStorage.map.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}_v1_`))).toHaveLength(1)
    // original v1 payload untouched until the first save
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).version).toBe(1)
  })

  it('a legacy member never predates-or-postdates their own expenses', () => {
    const odd = { ...v1Trip, members: v1Trip.members.map((m) => ({ ...m, createdAt: 8000 })) }
    const t = sanitizeTrip(odd)
    expect(t.members.every((m) => m.joinedAt <= 6000)).toBe(true)
    // so settlement for the old expenses is unchanged
    const s = computeTripStats(t)
    expect(s.balanceSum).toBe(0)
    expect(s.byId.m1.paid).toBe(100001)
  })

  it('survives one unreadable trip', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, trips: [v1Trip, { id: 'bad', members: [{}] }] }))
    const { trips, status } = loadTrips()
    expect(trips).toHaveLength(1)
    expect(status).toBe('recovered')
  })
})

describe('expense validation by currency', () => {
  const base = { title: 'Tea', currencyCode: 'JPY', payerId: 'a', participantIds: ['a'], eligibleIds: ['a'] }
  it('rejects decimals for zero-decimal currencies', () => {
    expect(validateExpense({ ...base, amountInput: '100.5' }).errors.amount).toBeTruthy()
    expect(validateExpense({ ...base, amountInput: '100' }).ok).toBe(true)
  })
  it('rejects ineligible payer or participants', () => {
    expect(validateExpense({ ...base, amountInput: '1', payerId: 'z' }).errors.payer).toBeTruthy()
    expect(validateExpense({ ...base, amountInput: '1', participantIds: ['a', 'z'] }).errors.participants).toBeTruthy()
    expect(validateExpense({ ...base, amountInput: '1', participantIds: [] }).errors.participants).toBeTruthy()
  })
})
