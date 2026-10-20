import { ChevronRight, Clock, MapPin, Receipt, Users } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { formatMoney } from '../lib/currency.js'
import { formatDate, formatRelative } from '../lib/dates.js'
import { TripThumbnail } from './TripThumbnail.jsx'
import { StatusBadge } from './ui.jsx'

/**
 * One trip in a list. Ongoing trips get a blue accent and an "Open" button,
 * completed trips are quieter and open their final settlement.
 */
export function TripCard({ trip, stats, index = 0 }) {
  const done = trip.status === 'completed'
  const money = (n) => formatMoney(n, trip.currencyCode)
  return (
    <button
      onClick={() => navigate(done ? `/trip/${trip.id}/settlement` : `/trip/${trip.id}`)}
      className={`card relative w-full overflow-hidden p-4 text-left transition active:scale-[0.99] ${done ? 'opacity-95' : ''}`}
      aria-label={`${trip.name}, ${done ? 'completed' : 'ongoing'}, ${money(stats.total)}`}
    >
      {!done && <span className="absolute inset-y-0 left-0 w-1.5 bg-purple" aria-hidden="true" />}
      <div className="flex items-start gap-3">
        <TripThumbnail trip={trip} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[17px] font-extrabold leading-tight">{trip.name}</h3>
            <StatusBadge status={trip.status} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-mute">
            <span className="rounded-md bg-sunken px-1.5 py-0.5 text-[11px] font-bold text-ink">{trip.currencyCode}</span>
            <span>Created {formatDate(trip.createdAt)}</span>
          </p>
          {trip.destination && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] font-medium text-mute">
              <MapPin size={13} className="shrink-0" /> {trip.destination}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 rounded-2xl bg-sunken/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-mute">Total expenses</p>
          <p className="truncate text-[22px] font-extrabold leading-tight tabular-nums">{money(stats.total)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] font-semibold text-mute">
            <span className="flex items-center gap-1">
              <Users size={12} /> {stats.memberCount} {stats.memberCount === 1 ? 'member' : 'members'}
            </span>
            <span className="flex items-center gap-1">
              <Receipt size={12} /> {stats.expenseCount}
            </span>
            {!done && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatRelative(trip.updatedAt)}
              </span>
            )}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-0.5 rounded-xl px-3 py-2 text-sm font-bold ${
            done ? 'bg-surface text-ink' : 'bg-brand text-on-brand'
          }`}
        >
          {done ? 'View' : 'Open'} <ChevronRight size={16} />
        </span>
      </div>
    </button>
  )
}
