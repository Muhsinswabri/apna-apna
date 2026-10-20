import { isCurrencyCode } from './currencies.js'
import { maxMinor, toMinor } from './currency.js'
import { nameKey, normalizeName } from './text.js'

export { nameKey, normalizeName }

export const MIN_MEMBERS = 2
export const MAX_MEMBERS = 30

/** Indexes of names that duplicate an earlier name (case/space-insensitive). */
export function findDuplicateIndexes(names) {
  const seen = new Set()
  const dupes = new Set()
  names.forEach((n, i) => {
    const k = nameKey(n)
    if (!k) return
    if (seen.has(k)) dupes.add(i)
    seen.add(k)
  })
  return dupes
}

/**
 * Business rules for creating a trip. The UI and createTrip() both use this.
 * @returns {{ok: boolean, nameError?: string, currencyError?: string, countError?: string, memberErrors: Record<number,string>}}
 */
export function validateTripSetup({ name, currencyCode, memberCount, memberNames }) {
  const result = { ok: true, memberErrors: {} }
  if (!normalizeName(name)) {
    result.nameError = 'Give your trip a name'
    result.ok = false
  }
  if (!isCurrencyCode(currencyCode)) {
    result.currencyError = 'Choose a currency from the list'
    result.ok = false
  }
  if (!Number.isInteger(memberCount) || memberCount < MIN_MEMBERS || memberCount > MAX_MEMBERS) {
    result.countError = `A trip needs between ${MIN_MEMBERS} and ${MAX_MEMBERS} members`
    result.ok = false
  } else if (memberNames.length !== memberCount) {
    result.countError = 'Enter a name for every member'
    result.ok = false
  }
  const dupes = findDuplicateIndexes(memberNames)
  memberNames.forEach((n, i) => {
    if (!normalizeName(n)) result.memberErrors[i] = 'Name is required'
    else if (dupes.has(i)) result.memberErrors[i] = 'Another member already has this name'
  })
  if (Object.keys(result.memberErrors).length) result.ok = false
  return result
}

/** Validate a member name against the other members of the same trip (departed ones included). */
export function validateMemberName(name, otherNames) {
  const clean = normalizeName(name)
  if (!clean) return 'Name is required'
  if (otherNames.some((o) => nameKey(o) === nameKey(clean))) return 'Another member already has this name'
  return null
}

/**
 * @param {object} p
 * @param {string[]} p.eligibleIds members who may pay for / share this expense
 * @returns {{ok: boolean, errors: Record<string,string>, amount: number|null}}
 */
export function validateExpense({ title, amountInput, currencyCode, payerId, participantIds, eligibleIds }) {
  const errors = {}
  if (!normalizeName(title)) errors.title = 'Enter what this expense was for'
  const amount = toMinor(amountInput, currencyCode)
  if (amount === null) errors.amount = 'Enter a valid amount for this currency'
  else if (amount <= 0) errors.amount = 'Amount must be greater than zero'
  else if (amount > maxMinor(currencyCode)) errors.amount = 'Amount is too large'
  if (!payerId) errors.payer = 'Select who paid'
  else if (!eligibleIds.includes(payerId)) errors.payer = 'This person was not on the trip at that time'
  if (!participantIds.length) errors.participants = 'Select at least one person to share this expense'
  else if (participantIds.some((id) => !eligibleIds.includes(id))) {
    errors.participants = 'Someone selected was not on the trip at that time'
  }
  return { ok: Object.keys(errors).length === 0, errors, amount: errors.amount ? null : amount }
}
