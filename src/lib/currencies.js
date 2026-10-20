// Static, offline currency list. `digits` is the number of minor-unit decimals
// (ISO 4217): amounts are always stored as integers in these minor units.

export const DEFAULT_CURRENCY = 'INR'

const c = (code, name, symbol, digits = 2) => ({ code, name, symbol, digits })

// Popular for this app's users first, then everything else A to Z by name.
export const CURRENCIES = [
  c('INR', 'Indian Rupee', '₹'),
  c('USD', 'US Dollar', '$'),
  c('AED', 'UAE Dirham', 'د.إ'),
  c('SAR', 'Saudi Riyal', 'ر.س'),
  c('GBP', 'British Pound', '£'),
  c('EUR', 'Euro', '€'),
  c('QAR', 'Qatari Riyal', 'ر.ق'),
  c('OMR', 'Omani Rial', 'ر.ع', 3),
  c('KWD', 'Kuwaiti Dinar', 'د.ك', 3),
  c('BHD', 'Bahraini Dinar', 'د.ب', 3),
  c('ARS', 'Argentine Peso', 'AR$'),
  c('AUD', 'Australian Dollar', 'A$'),
  c('BDT', 'Bangladeshi Taka', '৳'),
  c('BTN', 'Bhutanese Ngultrum', 'Nu.'),
  c('BRL', 'Brazilian Real', 'R$'),
  c('BGN', 'Bulgarian Lev', 'лв'),
  c('KHR', 'Cambodian Riel', '៛'),
  c('CAD', 'Canadian Dollar', 'C$'),
  c('CLP', 'Chilean Peso', 'CL$', 0),
  c('CNY', 'Chinese Yuan', 'CN¥'),
  c('COP', 'Colombian Peso', 'CO$'),
  c('CZK', 'Czech Koruna', 'Kč'),
  c('DKK', 'Danish Krone', 'kr'),
  c('EGP', 'Egyptian Pound', 'E£'),
  c('GHS', 'Ghanaian Cedi', 'GH₵'),
  c('HKD', 'Hong Kong Dollar', 'HK$'),
  c('HUF', 'Hungarian Forint', 'Ft'),
  c('ISK', 'Icelandic Krona', 'Íkr', 0),
  c('IDR', 'Indonesian Rupiah', 'Rp'),
  c('ILS', 'Israeli New Shekel', '₪'),
  c('JPY', 'Japanese Yen', '¥', 0),
  c('JOD', 'Jordanian Dinar', 'د.أ', 3),
  c('KES', 'Kenyan Shilling', 'KSh'),
  c('LAK', 'Lao Kip', '₭'),
  c('MYR', 'Malaysian Ringgit', 'RM'),
  c('MVR', 'Maldivian Rufiyaa', 'Rf'),
  c('MUR', 'Mauritian Rupee', '₨'),
  c('MXN', 'Mexican Peso', 'MX$'),
  c('MAD', 'Moroccan Dirham', 'د.م.'),
  c('MMK', 'Myanmar Kyat', 'K'),
  c('NPR', 'Nepalese Rupee', 'रू'),
  c('NZD', 'New Zealand Dollar', 'NZ$'),
  c('NGN', 'Nigerian Naira', '₦'),
  c('NOK', 'Norwegian Krone', 'Nkr'),
  c('PKR', 'Pakistani Rupee', 'Rs'),
  c('PEN', 'Peruvian Sol', 'S/'),
  c('PHP', 'Philippine Peso', '₱'),
  c('PLN', 'Polish Zloty', 'zł'),
  c('RON', 'Romanian Leu', 'lei'),
  c('RUB', 'Russian Ruble', '₽'),
  c('SGD', 'Singapore Dollar', 'S$'),
  c('ZAR', 'South African Rand', 'R'),
  c('KRW', 'South Korean Won', '₩', 0),
  c('LKR', 'Sri Lankan Rupee', 'Rs'),
  c('SEK', 'Swedish Krona', 'Skr'),
  c('CHF', 'Swiss Franc', 'CHF'),
  c('TWD', 'New Taiwan Dollar', 'NT$'),
  c('TZS', 'Tanzanian Shilling', 'TSh'),
  c('THB', 'Thai Baht', '฿'),
  c('TND', 'Tunisian Dinar', 'د.ت', 3),
  c('TRY', 'Turkish Lira', '₺'),
  c('UGX', 'Ugandan Shilling', 'USh', 0),
  c('UAH', 'Ukrainian Hryvnia', '₴'),
  c('VND', 'Vietnamese Dong', '₫', 0),
]

const BY_CODE = new Map(CURRENCIES.map((x) => [x.code, x]))

export function getCurrency(code) {
  return BY_CODE.get(code) ?? null
}

export function isCurrencyCode(code) {
  return BY_CODE.has(code)
}

/** Like getCurrency but never null: unknown codes fall back to the default. */
export function resolveCurrency(code) {
  return BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_CURRENCY)
}

/**
 * Search by name, ISO code or symbol. Best matches first; an empty query
 * returns the whole list in its default order.
 */
export function searchCurrencies(query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return CURRENCIES
  const scored = []
  CURRENCIES.forEach((cur, order) => {
    const code = cur.code.toLowerCase()
    const name = cur.name.toLowerCase()
    let score = 0
    if (code === q) score = 100
    else if (cur.symbol.toLowerCase() === q) score = 90
    else if (code.startsWith(q)) score = 80
    else if (name.startsWith(q)) score = 70
    else if (name.split(' ').some((w) => w.startsWith(q))) score = 60
    else if (name.includes(q) || cur.symbol.toLowerCase().includes(q)) score = 40
    if (score) scored.push({ cur, score, order })
  })
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((s) => s.cur)
}
