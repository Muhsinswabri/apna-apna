/**
 * Capitalise the first letter of every word, leaving the rest as typed.
 * "wayanad trip" -> "Wayanad Trip"; "McDonald" and "NASA" are untouched.
 * Spacing is preserved so it is safe to run on every keystroke.
 */
export function toTitleCase(value) {
  return String(value ?? '').replace(/(^|\s)(\p{Ll})/gu, (_, lead, ch) => {
    const up = ch.toUpperCase()
    return lead + (up.length === 1 ? up : ch) // skip letters like "ß" that expand
  })
}

/** Trim, collapse repeated spaces and apply Title Case. Use before saving. */
export function normalizeName(value) {
  return toTitleCase(String(value ?? '').trim().replace(/\s+/g, ' '))
}

/** Key for duplicate detection and search: case and spacing never matter. */
export function nameKey(value) {
  return normalizeName(value).toLowerCase()
}
