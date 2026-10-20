// All money is handled as integer paise. 1 rupee = 100 paise.

/**
 * Parse user input ("1,250.50", "₹ 80", 99.5) into integer paise.
 * Returns null when the input is not a valid amount with at most 2 decimals.
 */
export function toPaise(input) {
  if (input === null || input === undefined) return null
  const raw = String(input).replace(/[₹,\s]/g, '')
  if (!/^\d*\.?\d{0,2}$/.test(raw) || raw === '' || raw === '.') return null
  const [whole = '0', frac = ''] = raw.split('.')
  const paise = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0') || '0')
  return Number.isSafeInteger(paise) ? paise : null
}

const wholeFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const fracFmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Plain number string in Indian grouping, decimals only when needed. */
export function formatNumber(paise) {
  const abs = Math.abs(paise)
  return abs % 100 === 0 ? wholeFmt.format(abs / 100) : fracFmt.format(abs / 100)
}

/** "₹1,25,000" / "₹80.50". Negative amounts keep a leading minus. */
export function formatINR(paise) {
  return `${paise < 0 ? '−' : ''}₹${formatNumber(paise)}`
}

/** Always shows a sign for non-zero values: "+₹3,000" / "−₹1,000" / "₹0". */
export function formatSignedINR(paise) {
  if (paise === 0) return '₹0'
  return `${paise > 0 ? '+' : '−'}₹${formatNumber(paise)}`
}

/** Paise to a plain "1250.50" string for CSV output. */
export function paiseToPlain(paise) {
  const abs = Math.abs(paise)
  const s = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
  return paise < 0 ? `-${s}` : s
}

/** Editing-friendly string: "1250" or "1250.5". */
export function paiseToInput(paise) {
  return paiseToPlain(paise).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}
