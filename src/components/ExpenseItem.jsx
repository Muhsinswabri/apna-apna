import { ChevronRight } from 'lucide-react'
import { formatDateTime } from '../lib/dates.js'
import { formatINR } from '../lib/currency.js'
import { CategoryIcon } from './CategoryIcon.jsx'

export function ExpenseItem({ expense, payerName, onClick }) {
  const n = expense.participantIds.length
  // Largest allocation, so an uneven split reads "~₹50.01" like the add form preview.
  const each = Math.max(...Object.values(expense.allocations))
  const uneven = each * n !== expense.amount
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:bg-sunken"
    >
      <CategoryIcon title={expense.title} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold">{expense.title}</span>
          <span className="shrink-0 font-extrabold tabular-nums">{formatINR(expense.amount)}</span>
        </span>
        <span className="block truncate text-[13px] text-mute">
          {payerName} paid · {n} {n === 1 ? 'person' : 'people'} · {uneven ? '~' : ''}
          {formatINR(each)} each
        </span>
        <span className="block text-xs text-mute/80">{formatDateTime(expense.createdAt)}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-mute/50" />
    </button>
  )
}
