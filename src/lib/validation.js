import { toPaise } from './currency.js'

export const MAX_MEMBERS = 30
export const MAX_AMOUNT_PAISE = 10_000_000_000 // 10 crore rupees per expense

export function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ')
}

export function nameKey(name) {
  return normalizeName(name).toLowerCase()
}

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
 * @returns {{ok: boolean, nameError?: string, countError?: string, memberErrors: Record<number,string>}}
 */
export function validateTripSetup({ name, memberCount, memberNames }) {
  const result = { ok: true, memberErrors: {} }
  if (!normalizeName(name)) {
    result.nameError = 'Give your trip a name'
    result.ok = false
  }
  if (!Number.isInteger(memberCount) || memberCount < 1 || memberCount > MAX_MEMBERS) {
    result.countError = `Members must be between 1 and ${MAX_MEMBERS}`
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

/** Validate a member rename against the other members of the same trip. */
export function validateMemberName(name, otherNames) {
  const clean = normalizeName(name)
  if (!clean) return 'Name is required'
  if (otherNames.some((o) => nameKey(o) === nameKey(clean))) return 'Another member already has this name'
  return null
}

/**
 * @returns {{ok: boolean, errors: Record<string,string>, amount: number|null}}
 */
export function validateExpense({ title, amountInput, payerId, participantIds, memberIds }) {
  const errors = {}
  if (!normalizeName(title)) errors.title = 'Enter what this expense was for'
  const amount = toPaise(amountInput)
  if (amount === null) errors.amount = 'Enter a valid amount (up to 2 decimals)'
  else if (amount <= 0) errors.amount = 'Amount must be greater than zero'
  else if (amount > MAX_AMOUNT_PAISE) errors.amount = 'Amount is too large'
  if (!payerId || !memberIds.includes(payerId)) errors.payer = 'Select who paid'
  if (!participantIds.length || participantIds.some((id) => !memberIds.includes(id))) {
    errors.participants = 'Select at least one person to share this expense'
  }
  return { ok: Object.keys(errors).length === 0, errors, amount: errors.amount ? null : amount }
}
