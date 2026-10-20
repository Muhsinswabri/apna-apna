import { allocateExpense } from './calculations.js'
import { DEFAULT_CURRENCY } from './currencies.js'
import { eligibleAt, isActiveAt } from './members.js'
import { makeId } from './storage.js'
import { normalizeName, validateMemberName, validateTripSetup } from './validation.js'

const firstError = (r) =>
  r.nameError ?? r.currencyError ?? r.countError ?? Object.values(r.memberErrors ?? {})[0] ?? 'Invalid trip'

export function createTrip({ name, destination = '', currencyCode = DEFAULT_CURRENCY, memberNames }) {
  const check = validateTripSetup({ name, currencyCode, memberCount: memberNames.length, memberNames })
  if (!check.ok) throw new Error(firstError(check))
  const now = Date.now()
  return {
    id: makeId(),
    name: normalizeName(name),
    destination: normalizeName(destination),
    currencyCode,
    createdAt: now,
    updatedAt: now,
    status: 'ongoing',
    completedAt: null,
    members: memberNames.map((n) => newMember(n, now)),
    expenses: [],
  }
}

function newMember(name, now) {
  return { id: makeId(), name: normalizeName(name), joinedAt: now, leftAt: null, status: 'active' }
}

/** Add a member mid-trip. They only share expenses recorded from now on. */
export function addMember(trip, name, now = Date.now()) {
  const error = validateMemberName(name, trip.members.map((m) => m.name))
  if (error) throw new Error(error)
  return { ...trip, members: [...trip.members, newMember(name, now)] }
}

/** Mark a member as left. Their history stays; they just stop being offered for new expenses. */
export function markMemberLeft(trip, memberId, now = Date.now()) {
  const member = trip.members.find((m) => m.id === memberId)
  if (!member || member.leftAt) throw new Error('This member is not on the trip')
  if (trip.members.filter((m) => !m.leftAt).length <= 1) throw new Error('At least one member must stay on the trip')
  return {
    ...trip,
    members: trip.members.map((m) => (m.id === memberId ? { ...m, leftAt: Math.max(now, m.joinedAt), status: 'left' } : m)),
  }
}

/** Undo "left". Only safe while nothing was recorded since they left (see canRejoin). */
export function rejoinMember(trip, memberId) {
  return {
    ...trip,
    members: trip.members.map((m) => (m.id === memberId ? { ...m, leftAt: null, status: 'active' } : m)),
  }
}

/** Reject payers or participants who were not on the trip when the expense happened. */
function assertEligible(eligibleIds, payerId, participantIds) {
  if (!participantIds.length) throw new Error('Select at least one person to share this expense')
  if (!eligibleIds.has(payerId)) throw new Error('The payer was not on the trip at that time')
  if (participantIds.some((id) => !eligibleIds.has(id))) throw new Error('Someone selected was not on the trip at that time')
}

function assertAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Amount must be greater than zero')
}

/** Build a new expense. Date and time come from the device clock (or `now` in tests). */
export function createExpense(trip, { title, category = '', amount, payerId, participantIds }, now = Date.now()) {
  assertAmount(amount)
  assertEligible(new Set(eligibleAt(trip, now).map((m) => m.id)), payerId, participantIds)
  return {
    id: makeId(),
    title: normalizeName(title),
    category: normalizeName(category),
    amount,
    payerId,
    participantIds,
    allocations: allocateExpense(amount, participantIds, trip.members),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Apply edits to an expense, keeping its id and original creation time.
 * Eligibility is judged at the time the expense was created, plus whoever
 * it already referenced, so old expenses never pick up later joiners.
 */
export function editExpense(trip, expense, { title, category = '', amount, payerId, participantIds }) {
  assertAmount(amount)
  const eligible = new Set(trip.members.filter((m) => isActiveAt(m, expense.createdAt)).map((m) => m.id))
  eligible.add(expense.payerId)
  expense.participantIds.forEach((id) => eligible.add(id))
  assertEligible(eligible, payerId, participantIds)
  return {
    ...expense,
    title: normalizeName(title),
    category: normalizeName(category),
    amount,
    payerId,
    participantIds,
    allocations: allocateExpense(amount, participantIds, trip.members),
    updatedAt: Date.now(),
  }
}

/** Members who can be picked on the form for this expense (new, or editing an old one). */
export function eligibleForExpense(trip, expense, now = Date.now()) {
  if (!expense) return eligibleAt(trip, now)
  const keep = new Set([expense.payerId, ...expense.participantIds])
  return trip.members.filter((m) => isActiveAt(m, expense.createdAt) || keep.has(m.id))
}

export function touch(trip, changes) {
  return { ...trip, ...changes, updatedAt: Date.now() }
}

export function sortExpensesNewestFirst(expenses) {
  return [...expenses].sort((a, b) => b.createdAt - a.createdAt)
}
