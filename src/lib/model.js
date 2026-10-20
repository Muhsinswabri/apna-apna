import { allocateExpense } from './calculations.js'
import { makeId } from './storage.js'
import { normalizeName } from './validation.js'

export function createTrip({ name, memberNames }) {
  const now = Date.now()
  return {
    id: makeId(),
    name: normalizeName(name),
    createdAt: now,
    updatedAt: now,
    status: 'ongoing',
    completedAt: null,
    members: memberNames.map((n) => ({ id: makeId(), name: normalizeName(n), createdAt: now })),
    expenses: [],
  }
}

/** Build a new expense. Date and time come from the device clock. */
export function createExpense(trip, { title, amount, payerId, participantIds }) {
  const now = Date.now()
  return {
    id: makeId(),
    title: normalizeName(title),
    amount,
    payerId,
    participantIds,
    allocations: allocateExpense(amount, participantIds, trip.members),
    createdAt: now,
    updatedAt: now,
  }
}

/** Apply edits to an expense, keeping its id and original creation time. */
export function editExpense(trip, expense, { title, amount, payerId, participantIds }) {
  return {
    ...expense,
    title: normalizeName(title),
    amount,
    payerId,
    participantIds,
    allocations: allocateExpense(amount, participantIds, trip.members),
    updatedAt: Date.now(),
  }
}

export function touch(trip, changes) {
  return { ...trip, ...changes, updatedAt: Date.now() }
}

export function sortExpensesNewestFirst(expenses) {
  return [...expenses].sort((a, b) => b.createdAt - a.createdAt)
}
