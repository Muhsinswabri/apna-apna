import { allocateExpense, sum } from './calculations.js'
import { nameKey, normalizeName } from './validation.js'

export const STORAGE_KEY = 'apna_apna_trips'
export const THEME_KEY = 'apna_apna_theme'
export const SCHEMA_VERSION = 1
export const BACKUP_APP_ID = 'apna-apna'

export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function safeStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStr = (v) => typeof v === 'string' && v.length > 0
const isTime = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0

/**
 * Validate and repair one expense against its trip's members.
 * Allocations are recomputed whenever they are missing or do not add up,
 * so a stored expense can never create or lose money.
 */
export function sanitizeExpense(raw, members, fallbackTime) {
  if (!isObj(raw) || !isStr(raw.id) || typeof raw.title !== 'string') return null
  if (!Number.isSafeInteger(raw.amount) || raw.amount <= 0) return null
  const ids = new Set(members.map((m) => m.id))
  if (!ids.has(raw.payerId)) return null
  const participantIds = Array.isArray(raw.participantIds)
    ? [...new Set(raw.participantIds.filter((id) => ids.has(id)))]
    : []
  if (!participantIds.length) return null

  let allocations = null
  if (isObj(raw.allocations)) {
    const entries = Object.entries(raw.allocations)
    const valid =
      entries.length === participantIds.length &&
      entries.every(([id, p]) => participantIds.includes(id) && Number.isSafeInteger(p) && p >= 0) &&
      sum(entries.map(([, p]) => p)) === raw.amount
    if (valid) allocations = Object.fromEntries(entries)
  }
  if (!allocations) allocations = allocateExpense(raw.amount, participantIds, members)

  const createdAt = isTime(raw.createdAt) ? raw.createdAt : fallbackTime
  return {
    id: raw.id,
    title: normalizeName(raw.title) || 'Expense',
    amount: raw.amount,
    payerId: raw.payerId,
    participantIds,
    allocations,
    createdAt,
    updatedAt: isTime(raw.updatedAt) ? raw.updatedAt : createdAt,
  }
}

/** Validate and repair one trip. Returns null if it cannot be salvaged. */
export function sanitizeTrip(raw) {
  if (!isObj(raw) || !isStr(raw.id) || !Array.isArray(raw.members)) return null
  const now = Date.now()
  const createdAt = isTime(raw.createdAt) ? raw.createdAt : now

  const seenIds = new Set()
  const seenNames = new Set()
  const members = []
  for (const m of raw.members) {
    if (!isObj(m) || !isStr(m.id) || seenIds.has(m.id)) continue
    let name = normalizeName(m.name)
    if (!name) continue
    // Keep names unique inside a trip even if the stored data is damaged.
    while (seenNames.has(nameKey(name))) name += ' '.concat('2')
    seenIds.add(m.id)
    seenNames.add(nameKey(name))
    members.push({ id: m.id, name, createdAt: isTime(m.createdAt) ? m.createdAt : createdAt })
  }
  if (!members.length) return null

  const expenseIds = new Set()
  const expenses = []
  for (const e of Array.isArray(raw.expenses) ? raw.expenses : []) {
    const clean = sanitizeExpense(e, members, createdAt)
    if (!clean || expenseIds.has(clean.id)) continue
    expenseIds.add(clean.id)
    expenses.push(clean)
  }

  const completed = raw.status === 'completed'
  return {
    id: raw.id,
    name: normalizeName(raw.name) || 'Untitled trip',
    createdAt,
    updatedAt: isTime(raw.updatedAt) ? raw.updatedAt : createdAt,
    status: completed ? 'completed' : 'ongoing',
    completedAt: completed && isTime(raw.completedAt) ? raw.completedAt : completed ? createdAt : null,
    members,
    expenses,
  }
}

/**
 * Bring any stored shape up to the current one.
 * v0 (bare array of trips) -> v1 ({version, trips}).
 * Add new `if (version < N)` steps here when the schema changes.
 */
export function migrate(parsed) {
  let version = 0
  let trips
  if (Array.isArray(parsed)) {
    trips = parsed
  } else if (isObj(parsed) && Array.isArray(parsed.trips)) {
    version = Number.isInteger(parsed.version) ? parsed.version : 0
    trips = parsed.trips
  } else {
    return null
  }
  return { fromVersion: version, trips }
}

/** Keep a copy of data we are about to reinterpret, so nothing is lost. */
function backupRaw(store, raw, reason) {
  try {
    // Launching again with the same unreadable data must not pile up copies.
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k && k.startsWith(`${STORAGE_KEY}_`) && store.getItem(k) === raw) return
    }
    store.setItem(`${STORAGE_KEY}_${reason}_${Date.now()}`, raw)
  } catch {
    /* storage full: nothing more we can do */
  }
}

/**
 * Load trips. Never throws. Corrupt or newer-version data is copied to a
 * backup key before it is ever replaced.
 * @returns {{trips: object[], status: 'ok'|'empty'|'recovered'|'unavailable'}}
 */
export function loadTrips() {
  const store = safeStorage()
  if (!store) return { trips: [], status: 'unavailable' }
  let raw
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return { trips: [], status: 'unavailable' }
  }
  if (raw === null) return { trips: [], status: 'empty' }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    backupRaw(store, raw, 'corrupt')
    return { trips: [], status: 'recovered' }
  }
  const migrated = migrate(parsed)
  if (!migrated) {
    backupRaw(store, raw, 'corrupt')
    return { trips: [], status: 'recovered' }
  }
  const trips = migrated.trips.map(sanitizeTrip).filter(Boolean)
  const lostSomething = trips.length !== migrated.trips.length
  if (lostSomething || migrated.fromVersion > SCHEMA_VERSION) backupRaw(store, raw, 'recovered')
  return { trips, status: lostSomething || migrated.fromVersion > SCHEMA_VERSION ? 'recovered' : 'ok' }
}

/** Persist all trips immediately. Returns false if the write failed. */
export function saveTrips(trips) {
  const store = safeStorage()
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, trips }))
    return true
  } catch {
    return false
  }
}

export function loadTheme() {
  try {
    const t = safeStorage()?.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme) {
  try {
    const store = safeStorage()
    if (!store) return
    if (theme === 'system') store.removeItem(THEME_KEY)
    else store.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

// ---------- Backup export / import ----------

export function buildBackup(trips) {
  return {
    app: BACKUP_APP_ID,
    type: 'backup',
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    trips,
  }
}

/**
 * Validate a backup file's text and merge it into existing trips.
 * Existing trips are never overwritten: an imported trip whose id already
 * exists is added as a separate copy with a fresh id.
 * @returns {{ok: true, trips: object[], added: number, skipped: number} | {ok: false, error: string}}
 */
export function importBackup(text, existingTrips) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  if (!isObj(parsed) || parsed.app !== BACKUP_APP_ID || !Array.isArray(parsed.trips)) {
    return { ok: false, error: 'This is not an Apna Apna backup file.' }
  }
  if (Number.isInteger(parsed.version) && parsed.version > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of Apna Apna. Update the app and try again.' }
  }
  const incoming = parsed.trips.map(sanitizeTrip).filter(Boolean)
  if (!incoming.length) return { ok: false, error: 'No valid trips were found in this file.' }

  const usedIds = new Set(existingTrips.map((t) => t.id))
  const added = incoming.map((t) => {
    if (!usedIds.has(t.id)) {
      usedIds.add(t.id)
      return t
    }
    const id = makeId()
    usedIds.add(id)
    return { ...t, id }
  })
  return {
    ok: true,
    trips: [...existingTrips, ...added],
    added: added.length,
    skipped: parsed.trips.length - incoming.length,
  }
}
