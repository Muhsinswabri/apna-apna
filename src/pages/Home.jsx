import { ArrowRight, CheckCircle2, ChevronRight, Luggage, MapPin, Plus, Settings, Users } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { formatINR } from '../lib/currency.js'
import { formatDate } from '../lib/dates.js'
import { BottomNav } from '../components/BottomNav.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { InstallCard } from '../components/InstallCard.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { TripNotices } from '../components/TripNotices.jsx'
import { ContributionBar, Logo } from '../components/ui.jsx'

function OngoingCard({ trip, stats }) {
  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="card w-full p-5 text-left transition active:scale-[0.99]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-extrabold tracking-tight">{trip.name}</h3>
          <p className="mt-0.5 flex items-center gap-2 text-[13px] font-medium text-mute">
            <span className="flex items-center gap-1">
              <Users size={14} /> {stats.memberCount}
            </span>
            <span aria-hidden="true">·</span>
            {formatDate(trip.createdAt)}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ArrowRight size={18} />
        </span>
      </div>
      <p className="text-xs font-semibold text-mute">Total spent</p>
      <p className="mb-3 text-[28px] font-extrabold leading-tight tabular-nums tracking-tight">{formatINR(stats.total)}</p>
      <ContributionBar rows={stats.rows} />
      <p className="mt-2 text-xs text-mute">
        {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}
      </p>
    </button>
  )
}

function CompletedRow({ trip, stats }) {
  return (
    <button
      onClick={() => navigate(`/trip/${trip.id}/settlement`)}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:bg-sunken"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sunken text-mute">
        <CheckCircle2 size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{trip.name}</span>
        <span className="block text-xs text-mute">
          Completed {formatDate(trip.completedAt ?? trip.updatedAt)} · {stats.memberCount} members
        </span>
      </span>
      <span className="font-bold tabular-nums text-mute">{formatINR(stats.total)}</span>
      <ChevronRight size={16} className="shrink-0 text-mute/50" />
    </button>
  )
}

export default function Home() {
  const { trips } = useTrips()
  const withStats = trips.map((t) => ({ trip: t, stats: computeTripStats(t) }))
  const ongoing = withStats.filter((x) => x.trip.status !== 'completed')
  const completed = withStats.filter((x) => x.trip.status === 'completed')

  return (
    <>
      <header className="safe-top">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand">Apna Apna</p>
              <h1 className="text-[19px] font-extrabold leading-tight tracking-tight">Your trips, all sorted.</h1>
            </div>
          </div>
          <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
            <Settings size={20} />
          </IconButton>
        </div>
      </header>

      <Page nav className="flex flex-col gap-6">
        <TripNotices />

        <section className="hero-grad relative overflow-hidden rounded-[32px] p-6 shadow-card">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-4 h-44 w-44 animate-float opacity-90"
            viewBox="0 0 160 160"
            fill="none"
          >
            <circle cx="104" cy="56" r="44" fill="rgb(var(--c-surface) / 0.55)" />
            <circle cx="132" cy="108" r="22" fill="rgb(var(--c-mint) / 0.45)" />
            <path d="M96 100c8 8 18 12 26 10" stroke="rgb(var(--c-brand))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
            <path d="M104 30a18 18 0 0 1 18 18c0 14-18 30-18 30S86 62 86 48a18 18 0 0 1 18-18Z" fill="rgb(var(--c-brand))" />
            <circle cx="104" cy="48" r="6" fill="rgb(var(--c-surface))" />
          </svg>
          <div className="relative max-w-[78%]">
            <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-tight">Every trip. Every expense.</h2>
            <p className="mb-5 mt-2 text-sm font-medium leading-relaxed text-ink/70">
              Keep track of your group expenses without the confusion.
            </p>
          </div>
          <button onClick={() => navigate('/new')} className="btn-primary relative w-full">
            <Plus size={20} /> Start a New Trip
          </button>
        </section>

        {trips.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Luggage}
              title="No trips yet"
              text="Create a trip, add your friends once, and log every expense as you go. We will work out who pays whom."
              action={
                <button onClick={() => navigate('/new')} className="btn-soft">
                  <MapPin size={18} /> Plan your first trip
                </button>
              }
            />
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <section aria-label="Ongoing trips" className="flex flex-col gap-3">
                <h2 className="section-title px-1">Ongoing trips · {ongoing.length}</h2>
                {ongoing.map(({ trip, stats }) => (
                  <OngoingCard key={trip.id} trip={trip} stats={stats} />
                ))}
              </section>
            )}
            {completed.length > 0 && (
              <section aria-label="Completed trips" className="flex flex-col gap-2">
                <h2 className="section-title px-1">Completed trips</h2>
                <div className="card p-1.5">
                  {completed.map(({ trip, stats }) => (
                    <CompletedRow key={trip.id} trip={trip} stats={stats} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <InstallCard />
      </Page>
      <BottomNav />
    </>
  )
}
