// Money is always an integer count of the currency's minor units
// (paise for INR, cents for USD, fils for KWD, whole yen for JPY).
import { DEFAULT_CURRENCY, resolveCurrency } from './currencies.js'

const scale = (code) => 10 ** resolveCurrency(code).digits

/** Largest single amount accepted: 10 crore (100,000,000) major units. */
export function maxMinor(code = DEFAULT_CURRENCY) {
  return 100_000_000 * scale(code)
}

/**
 * Parse user input ("1,250.50", "₹ 80", 99.5) into integer minor units.
 * Returns null when the input is not a valid amount for that currency.
 */
export function toMinor(input, code = DEFAULT_CURRENCY) {
  if (input === null || input === undefined) return null
  const { digits, symbol } = resolveCurrency(code)
  const raw = String(input).replace(/[,\s ]/g, '').split(symbol).join('')
  const pattern = digits === 0 ? /^\d+$/ : new RegExp(`^\\d*\\.?\\d{0,${digits}}$`)
  if (!pattern.test(raw) || raw === '' || raw === '.') return null
  const [whole = '0', frac = ''] = raw.split('.')
  const minor = Number(whole || '0') * 10 ** digits + Number(frac.padEnd(digits, '0') || '0')
  return Number.isSafeInteger(minor) ? minor : null
}

// Fixed locales, so a device's language never changes how saved money reads.
const formatters = new Map()
function numberFormat(code, fractionDigits) {
  const locale = code === 'INR' ? 'en-IN' : 'en-US'
  const key = `${locale}|${fractionDigits}`
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }),
    )
  }
  return formatters.get(key)
}

/** Grouped number, decimals only when the amount has them: "1,25,000" / "80.50". */
export function formatNumber(minor, code = DEFAULT_CURRENCY) {
  const { digits } = resolveCurrency(code)
  const abs = Math.abs(minor)
  const factor = 10 ** digits
  const whole = digits === 0 || abs % factor === 0
  return numberFormat(code, whole ? 0 : digits).format(abs / factor)
}

// Arabic-script symbols would otherwise pull the digits into a right-to-left
// run ("1,000 د.إ"). A left-to-right mark after the symbol keeps the digits in
// order, and an isolate stops the amount from affecting the text around it.
const RTL_SYMBOL = /[֐-ࣿ]/
const LRM = '‎'
const NBSP = ' '
const LRI = '⁦'
const PDI = '⁩'

function symbolFor(code) {
  const { symbol } = resolveCurrency(code)
  const marked = RTL_SYMBOL.test(symbol) ? symbol + LRM : symbol
  return /[\p{L}.]$/u.test(symbol) ? marked + NBSP : marked
}

function isolate(code, text) {
  return RTL_SYMBOL.test(resolveCurrency(code).symbol) ? LRI + text + PDI : text
}

/** "₹1,25,000" / "$80.50" / "د.ك 1.250". Negative amounts keep a leading minus. */
export function formatMoney(minor, code = DEFAULT_CURRENCY) {
  return isolate(code, `${minor < 0 ? '−' : ''}${symbolFor(code)}${formatNumber(minor, code)}`)
}

/** Always shows a sign for non-zero values: "+₹3,000" / "−₹1,000" / "₹0". */
export function formatSignedMoney(minor, code = DEFAULT_CURRENCY) {
  if (minor === 0) return isolate(code, `${symbolFor(code)}0`)
  return isolate(code, `${minor > 0 ? '+' : '−'}${symbolFor(code)}${formatNumber(minor, code)}`)
}

/** Minor units to a plain "1250.50" string (always full precision) for CSV output. */
export function minorToPlain(minor, code = DEFAULT_CURRENCY) {
  const { digits } = resolveCurrency(code)
  const abs = Math.abs(minor)
  const factor = 10 ** digits
  const s =
    digits === 0 ? String(abs) : `${Math.floor(abs / factor)}.${String(abs % factor).padStart(digits, '0')}`
  return minor < 0 ? `-${s}` : s
}

/** Editing-friendly string: "1250" or "1250.5" (trailing zeros dropped). */
export function minorToInput(minor, code = DEFAULT_CURRENCY) {
  const plain = minorToPlain(minor, code)
  return plain.includes('.') ? plain.replace(/\.?0+$/, '') : plain
}
