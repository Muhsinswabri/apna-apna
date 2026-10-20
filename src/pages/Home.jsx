import { useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, Clock, MapPin, Plus, Receipt, Search, Settings, Users } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { formatMoney } from '../lib/currency.js'
import { formatDate, formatDateTime, formatRelative } from '../lib/dates.js'
import { BottomNav } from '../components/BottomNav.jsx'
import { CategoryIcon } from '../components/CategoryIcon.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { AdventureScene, FriendsHero, TripTile } from '../components/illustrations.jsx'
import { InstallCard } from '../components/InstallCard.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { TripNotices } from '../components/TripNotices.jsx'
import { Logo, StatusBadge } from '../components/ui.jsx'

const VISIBLE_COMPLETED = 3
const RECENT_ACTIVITY = 5

function OngoingCard({ trip, stats, index }) {
  const money = (n) => formatMoney(n, trip.currencyCode)
  return (
    <article className={`rounded-[28px] p-4 ${index === 0 ? 'hero-grad' : 'card'}`} aria-label={trip.name}>
      <div className="flex items-start gap-3">
        <TripTile index={index} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[17px] font-bold leading-tight tracking-tight">{trip.name}</h3>
            <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-bg">
              {trip.currencyCode}
            </span>
          </div>
          {trip.destination && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] font-semibold text-mute">
              <MapPin size={13} className="shrink-0" /> {trip.destination}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-mute">
            <Clock size={13} /> Updated {formatRelative(trip.updatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-surface/70 px-4 py-3 backdrop-blur">
        <p className="text-xs font-bold text-mute">Total expenses</p>
        <p className="text-[26px] font-bold leading-tight tabular-nums tracking-tight">{money(stats.total)}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-mute">
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {stats.activeCount} active {stats.activeCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1.5">
            <Receipt size={13} /> {stats.expenseCount} {stats.expenseCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="btn-primary h-12 min-w-0 whitespace-nowrap !px-3" onClick={() => navigate(`/trip/${trip.id}`)}>
          Continue Trip <ArrowRight size={17} />
        </button>
        <button className="btn-outline h-12 min-w-0 whitespace-nowrap !px-3" onClick={() => navigate(`/trip/${trip.id}/status`)}>
          Current Status
        </button>
      </div>
    </article>
  )
}

function CompletedCard({ trip, stats, index }) {
  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}/settlement`)}
      className="card w-full p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <TripTile index={index} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[17px] font-bold leading-tight tracking-tight">{trip.name}</h3>
            <StatusBadge status={trip.status} />
          </div>
          {trip.destination && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] font-semibold text-mute">
              <MapPin size={13} className="shrink-0" /> {trip.destination}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-mute">
            <Users size={13} /> {stats.memberCount} <span aria-hidden="true">·</span> {formatDate(trip.completedAt ?? trip.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-sunken px-4 py-2.5">
        <span className="text-xs font-bold text-mute">Total expenses · {trip.currencyCode}</span>
        <span className="flex items-center gap-1 text-lg font-bold tabular-nums">
          {formatMoney(stats.total, trip.currencyCode)} <ChevronRight size={18} className="text-mute" />
        </span>
      </div>
    </button>
  )
}

function ActivityRow({ item }) {
  const { trip, expense } = item
  const payer = trip.members.find((m) => m.id === expense.payerId)?.name ?? 'Someone'
  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}/expense/${expense.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:bg-sunken"
    >
      <CategoryIcon title={expense.category || expense.title} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold">{expense.title}</span>
          <span className="shrink-0 font-bold tabular-nums">{formatMoney(expense.amount, trip.currencyCode)}</span>
        </span>
        <span className="block truncate text-[13px] font-medium text-mute">
          {trip.name} · {payer} paid
        </span>
        <span className="block text-xs text-mute/80">{formatDateTime(expense.createdAt)}</span>
      </span>
    </button>
  )
}

export default function Home() {
  const { trips } = useTrips()
  const [showAllDone, setShowAllDone] = useState(false)
  const [query, setQuery] = useState('')

  // Recomputed from the live trip list, so new, edited and finished trips show up immediately.
  const { ongoing, completed } = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = (t) => !needle || `${t.name} ${t.destination}`.toLowerCase().includes(needle)
    const withStats = trips.filter(matches).map((t) => ({ trip: t, stats: computeTripStats(t) }))
    const byRecent = (a, b) => b.trip.updatedAt - a.trip.updatedAt
    return {
      ongoing: withStats.filter((x) => x.trip.status !== 'completed').sort(byRecent),
      completed: withStats.filter((x) => x.trip.status === 'completed').sort(byRecent),
    }
  }, [trips, query])

  const activity = useMemo(
    () =>
      trips
        .flatMap((trip) => trip.expenses.map((expense) => ({ trip, expense })))
        .sort((a, b) => b.expense.createdAt - a.expense.createdAt)
        .slice(0, RECENT_ACTIVITY),
    [trips],
  )

  const shownCompleted = showAllDone ? completed : completed.slice(0, VISIBLE_COMPLETED)

  const hero = (
    <section className="hero-grad overflow-hidden rounded-[32px] border border-line/80 p-5 shadow-card">
      <FriendsHero className="mx-auto mb-4 w-full max-w-[340px]" />
      <h2 className="text-[26px] font-bold leading-[1.15] tracking-tight">
        Trips are better when expenses are sorted.
      </h2>
      <p className="mb-5 mt-2 text-[15px] font-medium leading-relaxed text-ink/70">
        Track spending, split costs, and settle up with friends.
      </p>
      <button onClick={() => navigate('/new')} className="btn-primary h-14 w-full text-base">
        <Plus size={22} strokeWidth={2.8} /> Start a New Trip
      </button>
    </section>
  )

  return (
    <>
      <header className="safe-top">
        <div className="mx-auto max-w-lg px-4 pb-2 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Logo size={44} />
              <span className="text-[22px] font-bold tracking-tight">Apna Apna</span>
            </div>
            <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
              <Settings size={20} />
            </IconButton>
          </div>
          <h1 className="mt-6 text-[42px] font-semibold leading-[1.02]">Ready for your next trip?</h1>
          <p className="mt-2 text-[15px] font-medium text-mute">All your group expenses, in one place.</p>
          {trips.length > 0 && (
            <div className="relative mt-4">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="search"
                className="input !rounded-full !pl-11"
                placeholder="Search your trips"
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search trips"
              />
            </div>
          )}
        </div>
      </header>

      <Page nav className="flex flex-col gap-6">
        <TripNotices />

        {ongoing.length > 0 && (
          <section aria-label="Ongoing trips" className="flex flex-col gap-3">
            <h2 className="px-1 text-xl font-bold tracking-tight">Ongoing Trips</h2>
            {ongoing.map(({ trip, stats }, i) => (
              <OngoingCard key={trip.id} trip={trip} stats={stats} index={i} />
            ))}
          </section>
        )}

        {query.trim() && ongoing.length + completed.length === 0 && (
          <p className="card p-6 text-center text-sm text-mute">No trips match &ldquo;{query.trim()}&rdquo;.</p>
        )}

        {hero}

        {trips.length === 0 && (
          <div className="card">
            <EmptyState
              illustration={<AdventureScene className="w-full" />}
              title="Your next adventure starts here."
              text="Create a trip, add your friends once, and log every expense as you go."
              action={
                <button onClick={() => navigate('/new')} className="btn-primary">
                  <Plus size={20} strokeWidth={2.8} /> Create Your First Trip
                </button>
              }
            />
          </div>
        )}

        {completed.length > 0 && (
          <section aria-label="Completed trips" className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight">Completed Trips</h2>
              {completed.length > VISIBLE_COMPLETED && (
                <button
                  className="text-sm font-bold text-accent underline-offset-4 hover:underline"
                  onClick={() => setShowAllDone((v) => !v)}
                >
                  {showAllDone ? 'Show less' : `View All (${completed.length})`}
                </button>
              )}
            </div>
            {shownCompleted.map(({ trip, stats }, i) => (
              <CompletedCard key={trip.id} trip={trip} stats={stats} index={i + ongoing.length} />
            ))}
          </section>
        )}

        {activity.length > 0 && (
          <section aria-label="Recent activity" className="flex flex-col gap-3">
            <h2 className="px-1 text-xl font-bold tracking-tight">Recent Activity</h2>
            <div className="card p-1.5">
              {activity.map((item) => (
                <ActivityRow key={item.expense.id} item={item} />
              ))}
            </div>
          </section>
        )}

        <InstallCard />
      </Page>
      <BottomNav />
    </>
  )
}
