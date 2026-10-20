import { beforeEach, describe, expect, it } from 'vitest'
import { createExpense, createTrip } from './model.js'
import {
  STORAGE_KEY,
  buildBackup,
  importBackup,
  loadTrips,
  sanitizeTrip,
  saveTrips,
} from './storage.js'
import { formatINR, formatSignedINR, paiseToInput, toPaise } from './currency.js'
import { validateExpense, validateTripSetup } from './validation.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
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

function sampleTrip() {
  const trip = createTrip({ name: 'Goa', memberNames: ['A', 'B', 'C'] })
  const ids = trip.members.map((m) => m.id)
  trip.expenses.push(createExpense(trip, { title: 'Hotel', amount: 100001, payerId: ids[0], participantIds: ids }))
  return trip
}

describe('persistence', () => {
  it('round-trips trips', () => {
    const t = sampleTrip()
    expect(saveTrips([t])).toBe(true)
    const { trips, status } = loadTrips()
    expect(status).toBe('ok')
    expect(trips).toEqual([t])
  })
  it('empty storage', () => {
    expect(loadTrips()).toEqual({ trips: [], status: 'empty' })
  })
  it('corrupt JSON is backed up, not crashed on', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const { trips, status } = loadTrips()
    expect(trips).toEqual([])
    expect(status).toBe('recovered')
    const keys = [...localStorage.map.keys()]
    expect(keys.some((k) => k.startsWith(`${STORAGE_KEY}_corrupt_`))).toBe(true)
  })
  it('does not duplicate the backup on repeated launches', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    loadTrips()
    loadTrips()
    const copies = [...localStorage.map.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}_`))
    expect(copies).toHaveLength(1)
  })
  it('wrong shape is treated as corrupt', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hello: 'world' }))
    expect(loadTrips().status).toBe('recovered')
  })
  it('migrates legacy bare array', () => {
    const t = sampleTrip()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([t]))
    const { trips, status } = loadTrips()
    expect(status).toBe('ok')
    expect(trips[0].id).toBe(t.id)
  })
  it('drops unsalvageable trips but keeps good ones, and backs up the original', () => {
    const t = sampleTrip()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, trips: [t, { id: 'x' }, null] }))
    const { trips, status } = loadTrips()
    expect(trips).toHaveLength(1)
    expect(status).toBe('recovered')
  })
  it('repairs allocations that do not add up', () => {
    const t = sampleTrip()
    t.expenses[0].allocations = { bogus: 5 }
    const clean = sanitizeTrip(JSON.parse(JSON.stringify(t)))
    const total = Object.values(clean.expenses[0].allocations).reduce((a, b) => a + b, 0)
    expect(total).toBe(100001)
  })
  it('drops expenses referencing unknown payers', () => {
    const t = sampleTrip()
    t.expenses[0].payerId = 'ghost'
    expect(sanitizeTrip(t).expenses).toHaveLength(0)
  })
})

describe('backup import', () => {
  it('imports and never overwrites existing trips', () => {
    const t = sampleTrip()
    const text = JSON.stringify(buildBackup([t]))
    const res = importBackup(text, [t])
    expect(res.ok).toBe(true)
    expect(res.trips).toHaveLength(2)
    expect(new Set(res.trips.map((x) => x.id)).size).toBe(2)
    expect(res.trips[0]).toEqual(t)
  })
  it('rejects junk', () => {
    expect(importBackup('nope', []).ok).toBe(false)
    expect(importBackup('{"app":"other","trips":[]}', []).ok).toBe(false)
    expect(importBackup(JSON.stringify(buildBackup([])), []).ok).toBe(false)
  })
})

describe('currency', () => {
  it('parses amounts to paise without float error', () => {
    expect(toPaise('0.1')).toBe(10)
    expect(toPaise('19.99')).toBe(1999)
    expect(toPaise('1,250.5')).toBe(125050)
    expect(toPaise('₹ 80')).toBe(8000)
    expect(toPaise('1.005')).toBeNull()
    expect(toPaise('abc')).toBeNull()
    expect(toPaise('')).toBeNull()
    expect(toPaise('-5')).toBeNull()
  })
  it('formats in Indian grouping', () => {
    expect(formatINR(12500000)).toBe('₹1,25,000')
    expect(formatINR(8050)).toBe('₹80.50')
    expect(formatSignedINR(-100000)).toBe('−₹1,000')
    expect(formatSignedINR(0)).toBe('₹0')
    expect(paiseToInput(125050)).toBe('1250.5')
    expect(paiseToInput(100000)).toBe('1000')
  })
})

describe('validation', () => {
  it('rejects duplicate names ignoring case and spacing', () => {
    const r = validateTripSetup({ name: 'T', memberCount: 3, memberNames: ['Rafi', '  rafi ', 'Muhsin'] })
    expect(r.ok).toBe(false)
    expect(r.memberErrors[1]).toBeTruthy()
    expect(r.memberErrors[0]).toBeUndefined()
  })
  it('requires trip name, member count and names', () => {
    expect(validateTripSetup({ name: ' ', memberCount: 0, memberNames: [] })).toMatchObject({ ok: false })
    expect(validateTripSetup({ name: 'T', memberCount: 2, memberNames: ['a', ''] }).memberErrors[1]).toBeTruthy()
    expect(validateTripSetup({ name: 'T', memberCount: 1, memberNames: ['a'] }).ok).toBe(true)
  })
  it('validates expenses', () => {
    const base = { title: 'Food', amountInput: '10', payerId: 'a', participantIds: ['a'], memberIds: ['a', 'b'] }
    expect(validateExpense(base).ok).toBe(true)
    expect(validateExpense({ ...base, amountInput: '0' }).errors.amount).toBeTruthy()
    expect(validateExpense({ ...base, title: ' ' }).errors.title).toBeTruthy()
    expect(validateExpense({ ...base, payerId: '' }).errors.payer).toBeTruthy()
    expect(validateExpense({ ...base, participantIds: [] }).errors.participants).toBeTruthy()
  })
})
