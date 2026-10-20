import { ChevronRight } from 'lucide-react'
import { formatDateTime } from '../lib/dates.js'
import { formatMoney } from '../lib/currency.js'
import { CategoryIcon } from './CategoryIcon.jsx'

export function ExpenseItem({ expense, payerName, participantNames, currency, onClick }) {
  const n = expense.participantIds.length
  // Largest allocation, so an uneven split reads "~$50.01" like the add form preview.
  const each = Math.max(...Object.values(expense.allocations))
  const uneven = new Set(Object.values(expense.allocations)).size > 1
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:bg-sunken"
    >
      <CategoryIcon title={expense.category || expense.title} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold">{expense.title}</span>
          <span className="shrink-0 font-bold tabular-nums">{formatMoney(expense.amount, currency)}</span>
        </span>
        <span className="block truncate text-[13px] text-mute">
          {expense.category ? `${expense.category} · ` : ''}
          {payerName} paid
        </span>
        <span className="block truncate text-[13px] text-mute">
          {participantNames.join(', ')} · {uneven ? '~' : ''}
          {formatMoney(each, currency)} {n === 1 ? '' : 'each'}
        </span>
        <span className="block text-xs text-mute/80">{formatDateTime(expense.createdAt)}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-mute/50" />
    </button>
  )
}
