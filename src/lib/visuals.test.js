import { beforeEach, describe, expect, it } from 'vitest'
import { AVATARS, getDefaultMemberAvatar, getMemberAvatar, isAvatarId, pickAvatarId } from './avatars.js'
import { computeTripStats } from './calculations.js'
import { addMember, createExpense, createTrip, renameTrip } from './model.js'
import { STORAGE_KEY, loadTrips, sanitizeTrip, saveTrips } from './storage.js'
import { DEFAULT_TRIP_IMAGE, TRIP_IMAGE_IDS, getDefaultTripImage, getTripImageAsset, getTripImageCategory } from './tripImages.js'

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

describe('trip image category', () => {
  it.each([
    ['Wayanad Trip', 'hills'],
    ['Goa Trip', 'beach'],
    ['Dubai Trip', 'skyline'],
    ['Kashmir Trip', 'snow'],
    ['Ooty Trip', 'tea'],
    ['Bangalore Trip', 'city'],
    ['Family Trip', 'family'],
    ['Road Trip', 'road'],
    ['Beach Trip', 'beach'],
    ['Camping Trip', 'camping'],
  ])('%s -> %s', (name, expected) => {
    expect(getTripImageCategory(name)).toBe(expected)
  })

  it('ignores case, punctuation and spacing', () => {
    expect(getTripImageCategory('  wayanad,  TRIP!! ')).toBe('hills')
    expect(getTripImageCategory('Bengaluru weekend')).toBe('city')
    expect(getTripImageCategory('Goa-2026')).toBe('beach')
  })

  it('lets a named destination beat a general word', () => {
    expect(getTripImageCategory('Goa Family Trip')).toBe('beach')
    expect(getTripImageCategory('Munnar Road Trip')).toBe('tea')
    expect(getTripImageCategory('Wayanad Camping')).toBe('hills')
  })

  it('matches whole words only', () => {
    expect(getTripImageCategory('Cargo Planning')).toBe(DEFAULT_TRIP_IMAGE) // "car" is inside "cargo"
    expect(getTripImageCategory('Goal Setting')).toBe(DEFAULT_TRIP_IMAGE) // "goa" is inside "goal"
  })

  it('falls back to the default for unknown or empty names', () => {
    expect(getTripImageCategory('Xyzzy')).toBe(DEFAULT_TRIP_IMAGE)
    expect(getTripImageCategory('')).toBe(DEFAULT_TRIP_IMAGE)
    expect(getTripImageCategory(undefined)).toBe(DEFAULT_TRIP_IMAGE)
    expect(getDefaultTripImage()).toBe(DEFAULT_TRIP_IMAGE)
  })

  it('getTripImageAsset prefers the stored category and repairs bad ones', () => {
    expect(getTripImageAsset({ name: 'Goa Trip', imageCategory: 'snow' }).id).toBe('snow')
    expect(getTripImageAsset({ name: 'Goa Trip', imageCategory: 'nonsense' }).id).toBe('beach')
    expect(getTripImageAsset({ name: 'Goa Trip' }).id).toBe('beach')
    expect(TRIP_IMAGE_IDS).toContain(getTripImageAsset({}).id)
  })

  it('is saved with the trip and survives a reload', () => {
    const t = createTrip({ name: 'wayanad trip', memberNames: ['A', 'B'] })
    expect(t.imageCategory).toBe('hills')
    saveTrips([t])
    expect(loadTrips().trips[0].imageCategory).toBe('hills')
  })

  it('follows a rename and nothing else', () => {
    const t = createTrip({ name: 'Goa Trip', memberNames: ['A', 'B'] })
    t.expenses.push(createExpense(t, { title: 'Food', amount: 500, payerId: t.members[0].id, participantIds: t.members.map((m) => m.id) }))
    const r = renameTrip(t, 'kashmir  trip')
    expect(r.name).toBe('Kashmir Trip')
    expect(r.imageCategory).toBe('snow')
    expect(r.id).toBe(t.id)
    expect(r.members).toBe(t.members)
    expect(r.expenses).toBe(t.expenses)
    expect(() => renameTrip(t, '   ')).toThrow()
  })
})

describe('member avatars', () => {
  it('assigns a valid avatar to every member and keeps them different on one trip', () => {
    const t = createTrip({ name: 'Crew', memberNames: ['A', 'B', 'C', 'D', 'E', 'F'] })
    const ids = t.members.map((m) => m.avatarId)
    expect(ids.every(isAvatarId)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('stays unique until the collection runs out, then repeats rather than failing', () => {
    const names = Array.from({ length: AVATARS.length + 3 }, (_, i) => `Member ${String.fromCharCode(65 + i)}`)
    const t = createTrip({ name: 'Big', memberNames: names.slice(0, 30) })
    const ids = t.members.map((m) => m.avatarId)
    expect(ids.every(isAvatarId)).toBe(true)
    expect(new Set(ids.slice(0, AVATARS.length)).size).toBe(AVATARS.length)
  })

  it('picks deterministically from the id', () => {
    expect(pickAvatarId('abc')).toBe(pickAvatarId('abc'))
    expect(pickAvatarId('abc', new Set([pickAvatarId('abc')]))).not.toBe(pickAvatarId('abc'))
    expect(isAvatarId(pickAvatarId('anything', new Set(AVATARS.map((a) => a.id))))).toBe(true)
  })

  it('a member added later gets an avatar nobody else on the trip has', () => {
    const t = createTrip({ name: 'Crew', memberNames: ['A', 'B'] })
    const t2 = addMember(t, 'Rafi')
    const ids = t2.members.map((m) => m.avatarId)
    expect(new Set(ids).size).toBe(3)
  })

  it('is stable across save, load and renames, and keyed by id not name', () => {
    const t = createTrip({ name: 'Crew', memberNames: ['Muhsin', 'Niyas'] })
    const before = t.members.map((m) => m.avatarId)
    saveTrips([t])
    const loaded = loadTrips().trips[0]
    expect(loaded.members.map((m) => m.avatarId)).toEqual(before)
    const renamed = { ...loaded, members: loaded.members.map((m, i) => (i === 0 ? { ...m, name: 'Totally Different' } : m)) }
    expect(sanitizeTrip(renamed).members.map((m) => m.avatarId)).toEqual(before)
  })

  it('shows up in stats rows so every screen can draw the same face', () => {
    const t = createTrip({ name: 'Crew', memberNames: ['A', 'B'] })
    const s = computeTripStats(t)
    expect(s.rows.map((r) => r.avatarId)).toEqual(t.members.map((m) => m.avatarId))
  })

  it('has no art for an unknown avatar, so the UI falls back to initials', () => {
    expect(getMemberAvatar({ avatarId: 'gone' })).toBeNull()
    expect(getMemberAvatar({})).toBeNull()
    expect(getMemberAvatar({ avatarId: AVATARS[3].id })).toBe(AVATARS[3])
    expect(getDefaultMemberAvatar()).toBe(AVATARS[0])
  })
})

describe('migration of older data', () => {
  const v2Trip = {
    id: 't1',
    name: 'wayanad trip',
    currencyCode: 'INR',
    createdAt: 5000,
    updatedAt: 9000,
    status: 'ongoing',
    completedAt: null,
    members: [
      { id: 'm1', name: 'Muhsin', joinedAt: 5000, leftAt: null, status: 'active' },
      { id: 'm2', name: 'Niyas', joinedAt: 5000, leftAt: null, status: 'active' },
      { id: 'm3', name: 'Rafi', joinedAt: 5000, leftAt: null, status: 'active', avatarId: 'av-05' },
    ],
    expenses: [
      { id: 'e1', title: 'Hotel', amount: 90000, payerId: 'm1', participantIds: ['m1', 'm2', 'm3'], allocations: { m1: 30000, m2: 30000, m3: 30000 }, createdAt: 6000, updatedAt: 6000 },
    ],
  }

  it('infers a thumbnail and gives members stable avatars without touching ids or expenses', () => {
    const t = sanitizeTrip(JSON.parse(JSON.stringify(v2Trip)))
    expect(t.imageCategory).toBe('hills')
    expect(t.members.map((m) => m.id)).toEqual(['m1', 'm2', 'm3'])
    expect(t.members.every((m) => isAvatarId(m.avatarId))).toBe(true)
    expect(t.members[2].avatarId).toBe('av-05') // an existing avatar is kept
    expect(new Set(t.members.map((m) => m.avatarId)).size).toBe(3)
    expect(t.expenses).toHaveLength(1)
    expect(t.expenses[0].allocations).toEqual({ m1: 30000, m2: 30000, m3: 30000 })
    // loading the same data twice gives the same avatars
    expect(sanitizeTrip(JSON.parse(JSON.stringify(v2Trip))).members.map((m) => m.avatarId)).toEqual(t.members.map((m) => m.avatarId))
  })

  it('upgrades stored v2 data on load and keeps a copy of the original', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, trips: [v2Trip] }))
    const { trips, status } = loadTrips()
    expect(status).toBe('ok')
    expect(trips[0].imageCategory).toBe('hills')
    expect([...localStorage.map.keys()].some((k) => k.startsWith(`${STORAGE_KEY}_v2_`))).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).version).toBe(2) // untouched until the next save
  })

  it('replaces an unknown category or avatar with a valid one', () => {
    const bad = JSON.parse(JSON.stringify(v2Trip))
    bad.imageCategory = 'weird'
    bad.members[0].avatarId = 'nope'
    const t = sanitizeTrip(bad)
    expect(t.imageCategory).toBe('hills')
    expect(isAvatarId(t.members[0].avatarId)).toBe(true)
  })
})
