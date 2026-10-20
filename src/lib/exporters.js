import { fileDate, formatDateTime } from './dates.js'
import { formatINR, paiseToPlain } from './currency.js'
import { sortExpensesNewestFirst } from './model.js'
import { buildBackup } from './storage.js'

function csvCell(v) {
  const s = String(v ?? '')
  // Neutralise spreadsheet formula injection from user-typed text.
  const safe = /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const csvRow = (cells) => cells.map(csvCell).join(',')

export function safeFileName(name) {
  return (name || 'trip').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'trip'
}

export function tripToCsv(trip, stats) {
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const lines = []
  lines.push(csvRow(['Apna Apna trip summary']))
  lines.push(csvRow(['Trip', trip.name]))
  lines.push(csvRow(['Status', trip.status === 'completed' ? 'Completed' : 'Ongoing']))
  lines.push(csvRow(['Total expenses (INR)', paiseToPlain(stats.total)]))
  lines.push(csvRow(['Members', stats.memberCount]))
  lines.push(csvRow(['Equal share per member (INR)', paiseToPlain(stats.equalShare)]))
  lines.push('')
  lines.push(csvRow(['Expenses']))
  lines.push(csvRow(['Date and time', 'Title', 'Amount (INR)', 'Paid by', 'Participants and shares (INR)', 'Highest share per participant (INR)']))
  sortExpensesNewestFirst(trip.expenses).forEach((e) => {
    const share = Math.max(...Object.values(e.allocations))
    lines.push(
      csvRow([
        formatDateTime(e.createdAt),
        e.title,
        paiseToPlain(e.amount),
        nameOf(e.payerId),
        Object.entries(e.allocations)
          .map(([id, paise]) => `${nameOf(id)} ${paiseToPlain(paise)}`)
          .join('; '),
        paiseToPlain(share),
      ]),
    )
  })
  lines.push('')
  lines.push(csvRow(['Members']))
  lines.push(csvRow(['Member', 'Paid (INR)', 'Allocated share (INR)', 'Equal share (INR)', 'Final balance (INR)']))
  stats.rows.forEach((r) => {
    lines.push(csvRow([r.name, paiseToPlain(r.paid), paiseToPlain(r.allocated), paiseToPlain(r.equalShare), paiseToPlain(r.balance)]))
  })
  lines.push('')
  lines.push(csvRow(['Who pays whom']))
  lines.push(csvRow(['From', 'To', 'Amount (INR)']))
  stats.settlements.forEach((s) => lines.push(csvRow([nameOf(s.from), nameOf(s.to), paiseToPlain(s.amount)])))
  return '﻿' + lines.join('\r\n')
}

/** Plain-text settlement summary for sharing. */
export function settlementText(trip, stats) {
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const lines = [`${trip.name} - Apna Apna`, `Total: ${formatINR(stats.total)} | ${stats.memberCount} members | ${formatINR(stats.equalShare)} each`, '']
  lines.push('Paid:')
  stats.rows.forEach((r) => lines.push(`- ${r.name}: ${formatINR(r.paid)}`))
  lines.push('')
  if (stats.settlements.length) {
    lines.push('Who pays whom:')
    stats.settlements.forEach((s) => lines.push(`- ${nameOf(s.from)} pays ${nameOf(s.to)} ${formatINR(s.amount)}`))
  } else {
    lines.push('Everyone is settled.')
  }
  return lines.join('\n')
}

export function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportTripCsv(trip, stats) {
  downloadText(`apna-apna-${safeFileName(trip.name)}-${fileDate()}.csv`, tripToCsv(trip, stats), 'text/csv;charset=utf-8')
}

export function exportBackupJson(trips, label) {
  downloadText(
    `apna-apna-${label}-backup-${fileDate()}.json`,
    JSON.stringify(buildBackup(trips), null, 2),
    'application/json',
  )
}

/** Native share when available, clipboard otherwise. Returns 'shared' | 'copied' | 'failed'. */
export async function shareText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
