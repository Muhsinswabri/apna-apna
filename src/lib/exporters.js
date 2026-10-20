import { fileDate, formatDateTime } from './dates.js'
import { formatMoney, minorToPlain } from './currency.js'
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
  const code = trip.currencyCode
  const plain = (n) => minorToPlain(n, code)
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const lines = []
  lines.push(csvRow(['Apna Apna trip summary']))
  lines.push(csvRow(['Trip', trip.name]))
  lines.push(csvRow(['Currency', code]))
  lines.push(csvRow(['Status', trip.status === 'completed' ? 'Completed' : 'Ongoing']))
  lines.push(csvRow([`Total expenses (${code})`, plain(stats.total)]))
  lines.push(csvRow(['Active members', stats.activeCount]))
  lines.push(csvRow(['Departed members', stats.leftCount]))
  lines.push('')
  lines.push(csvRow(['Expenses']))
  lines.push(csvRow(['Date and time', 'Title', 'Category', `Amount (${code})`, 'Paid by', `Participants and shares (${code})`]))
  sortExpensesNewestFirst(trip.expenses).forEach((e) => {
    lines.push(
      csvRow([
        formatDateTime(e.createdAt),
        e.title,
        e.category,
        plain(e.amount),
        nameOf(e.payerId),
        Object.entries(e.allocations)
          .map(([id, minor]) => `${nameOf(id)} ${plain(minor)}`)
          .join('; '),
      ]),
    )
  })
  lines.push('')
  lines.push(csvRow(['Members']))
  lines.push(csvRow(['Member', 'Status', `Paid (${code})`, `Allocated share (${code})`, `Balance (${code})`]))
  stats.rows.forEach((r) => {
    lines.push(csvRow([r.name, r.active ? 'Active' : 'Left', plain(r.paid), plain(r.allocated), plain(r.balance)]))
  })
  lines.push('')
  lines.push(csvRow(['Who pays whom']))
  lines.push(csvRow(['From', 'To', `Amount (${code})`]))
  stats.settlements.forEach((s) => lines.push(csvRow([nameOf(s.from), nameOf(s.to), plain(s.amount)])))
  return '﻿' + lines.join('\r\n')
}

/** Plain-text settlement summary for sharing. */
export function settlementText(trip, stats) {
  const money = (n) => formatMoney(n, trip.currencyCode)
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const lines = [
    `${trip.name} - Apna Apna`,
    `${trip.status === 'completed' ? 'Final settlement' : 'Current status'} | ${trip.currencyCode}`,
    `Total: ${money(stats.total)} | ${stats.expenseCount} expenses | ${stats.memberCount} members`,
    '',
  ]
  lines.push('Paid / share / balance:')
  stats.rows.forEach((r) =>
    lines.push(`- ${r.name}${r.active ? '' : ' (left)'}: paid ${money(r.paid)}, share ${money(r.allocated)}, balance ${money(r.balance)}`),
  )
  lines.push('')
  if (stats.settlements.length) {
    lines.push('Who pays whom:')
    stats.settlements.forEach((s) => lines.push(`- ${nameOf(s.from)} pays ${nameOf(s.to)} ${money(s.amount)}`))
  } else {
    lines.push('Everyone is settled.')
  }
  return lines.join('\n')
}

export function downloadText(filename, text, mime) {
  downloadBlob(filename, new Blob([text], { type: mime }))
}

export function downloadBlob(filename, blob) {
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
