const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n) => String(n).padStart(2, '0')

/** "19 Oct 2026" in the device's local time. */
export function formatDate(ms) {
  const d = new Date(ms)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "09:42 AM" in the device's local time. */
export function formatTime(ms) {
  const d = new Date(ms)
  const h = d.getHours()
  return `${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`
}

/** "19 Oct 2026, 09:42 AM" */
export function formatDateTime(ms) {
  return `${formatDate(ms)}, ${formatTime(ms)}`
}

/** "just now", "5 min ago", "3 hr ago", "2 days ago", then a plain date. */
export function formatRelative(ms, now = Date.now()) {
  const mins = Math.floor((now - ms) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return formatDate(ms)
}

/** Filename-safe local timestamp: 2026-10-19 */
export function fileDate(ms = Date.now()) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
