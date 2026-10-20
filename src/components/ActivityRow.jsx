import { CheckCircle2, ChevronRight, Flag, LogOut, Pencil, Receipt, Trash2, UserPlus } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { formatMoney } from '../lib/currency.js'
import { formatDateTime } from '../lib/dates.js'

const KINDS = {
  expense_added: { Icon: Receipt, tone: 'bg-brand-soft text-brand-deep', label: 'Expense added' },
  expense_edited: { Icon: Pencil, tone: 'bg-lav text-[#5B3CC4] dark:text-[#CBBDFF]', label: 'Expense edited' },
  expense_deleted: { Icon: Trash2, tone: 'bg-neg-soft text-neg', label: 'Expense deleted' },
  member_joined: { Icon: UserPlus, tone: 'bg-mint text-[#1F6B3E] dark:text-[#9BE3B4]', label: 'Joined the trip' },
  member_left: { Icon: LogOut, tone: 'bg-sunken text-mute', label: 'Left the trip' },
  trip_created: { Icon: Flag, tone: 'bg-brand-soft text-brand-deep', label: 'Trip created' },
  trip_completed: { Icon: CheckCircle2, tone: 'bg-pos-soft text-pos', label: 'Trip completed' },
}

/** One line of the activity feed. Expense rows open the expense; the rest open the trip. */
export function ActivityRow({ event, showTrip = true }) {
  const kind = KINDS[event.type]
  const isExpense = event.type.startsWith('expense')
  const target =
    event.type === 'expense_deleted'
      ? `/trip/${event.tripId}`
      : isExpense
        ? `/trip/${event.tripId}/expense/${event.expenseId}`
        : event.type === 'trip_completed'
          ? `/trip/${event.tripId}/settlement`
          : `/trip/${event.tripId}`
  const detail = isExpense ? `${kind.label} · ${event.who} paid` : kind.label
  return (
    <button
      onClick={() => navigate(target)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:bg-sunken"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${kind.tone}`} aria-hidden="true">
        <kind.Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate font-bold ${event.type === 'expense_deleted' ? 'line-through decoration-mute/60' : ''}`}>
            {event.title}
          </span>
          {isExpense && (
            <span className="shrink-0 font-extrabold tabular-nums">{formatMoney(event.amount, event.currencyCode)}</span>
          )}
        </span>
        <span className="block truncate text-[13px] font-medium text-mute">
          {detail}
          {showTrip ? ` · ${event.tripName}` : ''}
        </span>
        <span className="block text-xs text-mute/80">{formatDateTime(event.at)}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-mute/50" />
    </button>
  )
}
