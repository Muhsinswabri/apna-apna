import { useMemo } from 'react'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, ChevronRight, Clock, MapPin, Plus, Receipt, Settings, Users } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { recentExpenses } from '../lib/activity.js'
import { computeTripStats } from '../lib/calculations.js'
import { formatMoney } from '../lib/currency.js'
import { formatDate, formatRelative } from '../lib/dates.js'
import { dailyTotals } from '../lib/insights.js'
import { ActivityRow } from '../components/ActivityRow.jsx'
import { BottomNav } from '../components/BottomNav.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { AdventureScene, FriendsHero, PlanIllustration } from '../components/illustrations.jsx'
import { TripThumbnail } from '../components/TripThumbnail.jsx'
import { InstallCard } from '../components/InstallCard.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { SparkChart } from '../components/SparkChart.jsx'
import { TripCard } from '../components/TripCard.jsx'
import { TripNotices } from '../components/TripNotices.jsx'
import { Logo } from '../components/ui.jsx'

const SHOWN_COMPLETED = 2
const SHOWN_ACTIVITY = 4

function SummaryTile({ icon: Icon, label, value, hint, tone = '' }) {
  return (
    <div className={`card p-4 ${tone}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold text-mute">
        <Icon size={14} /> {label}
      </p>
      <p className="mt-2 text-[22px] font-extrabold leading-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] font-medium leading-snug text-mute">{hint}</p>}
    </div>
  )
}

/**
 * The trip people most likely want next, on a rich purple panel. When other trips are
 * ongoing, two cards peek out from behind it. Colours are fixed so the panel reads the same in dark mode.
 */
function LeadTrip({ trip, stats, stacked }) {
  const money = (n) => formatMoney(n, trip.currencyCode)
  return (
    <section aria-label="Ongoing trip" className="relative mb-3">
      {stacked > 0 && (
        <>
          <span className="absolute inset-x-5 -bottom-3 top-6 rounded-[30px] bg-[#B5A8F0]" aria-hidden="true" />
          {stacked > 1 && <span className="absolute inset-x-9 -bottom-5 top-10 rounded-[30px] bg-[#D4CCF8]" aria-hidden="true" />}
        </>
      )}
      <div className="relative overflow-hidden rounded-[30px] bg-[#7563D8] p-5 text-white shadow-card">
        <TripThumbnail trip={trip} size={64} className="absolute right-4 top-4 ring-2 ring-white/60" />
        <div className="relative flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold">{trip.currencyCode}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9BE3B4]" /> Ongoing
          </span>
        </div>
        <h2 className="relative mt-4 max-w-[62%] truncate text-[24px] font-extrabold leading-tight">{trip.name}</h2>
        {trip.destination && (
          <p className="relative flex max-w-[62%] items-center gap-1 truncate text-[13px] font-semibold">
            <MapPin size={13} className="shrink-0" /> {trip.destination}
          </p>
        )}
        <p className="relative mt-5 text-xs font-bold">Total expenses</p>
        <p className="relative text-[42px] font-extrabold leading-none tabular-nums tracking-tight">{money(stats.total)}</p>
        <p className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {stats.activeCount} active {stats.activeCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1.5">
            <Receipt size={14} /> {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {formatRelative(trip.updatedAt)}
          </span>
        </p>
        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <button
            className="inline-flex h-12 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-white px-3 text-[15px] font-bold text-[#171A35] transition active:scale-[0.98]"
            onClick={() => navigate(`/trip/${trip.id}`)}
          >
            Continue Trip <ArrowRight size={17} />
          </button>
          <button
            className="inline-flex h-12 min-w-0 items-center justify-center whitespace-nowrap rounded-2xl border border-white/50 bg-white/10 px-3 text-[15px] font-bold text-white transition active:scale-[0.98]"
            onClick={() => navigate(`/trip/${trip.id}/status`)}
          >
            Current Status
          </button>
        </div>
      </div>
    </section>
  )
}

/** Mint call to action. Sits right under the ongoing trip. */
function NewTripCard() {
  return (
    <button
      onClick={() => navigate('/new')}
      className="flex w-full items-center gap-3 rounded-[26px] bg-mint p-4 text-left text-ink transition active:scale-[0.99]"
    >
      <PlanIllustration className="w-[88px] shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-[18px] font-extrabold leading-tight">Start a New Trip</span>
        <span className="mt-0.5 block text-[13px] font-semibold text-ink/70">Add your friends once and begin splitting.</span>
      </span>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-on-brand shadow-pop">
        <Plus size={22} strokeWidth={2.5} />
      </span>
    </button>
  )
}

export default function Home() {
  const { trips } = useTrips()

  const { ongoing, completed } = useMemo(() => {
    const withStats = trips.map((t) => ({ trip: t, stats: computeTripStats(t) }))
    const byRecent = (a, b) => b.trip.updatedAt - a.trip.updatedAt
    return {
      ongoing: withStats.filter((x) => x.trip.status !== 'completed').sort(byRecent),
      completed: withStats.filter((x) => x.trip.status === 'completed').sort(byRecent),
    }
  }, [trips])

  const activity = useMemo(() => recentExpenses(trips, SHOWN_ACTIVITY), [trips])
  const lead = ongoing[0]
  const others = ongoing.slice(1)
  const trend = useMemo(() => (lead ? dailyTotals(lead.trip.expenses, 8) : []), [lead])

  // Real counts from the lead trip's balances. Not combined with any other trip or currency.
  const owing = lead ? lead.stats.rows.filter((r) => r.balance < 0).length : 0
  const owed = lead ? lead.stats.rows.filter((r) => r.balance > 0).length : 0

  return (
    <>
      <header className="safe-top">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 pb-1 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={46} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-mute">Welcome back!</p>
              <p className="truncate text-[18px] font-extrabold leading-tight">Ready for your next trip?</p>
            </div>
          </div>
          <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
            <Settings size={19} />
          </IconButton>
        </div>
      </header>

      <Page nav className="flex flex-col gap-6">
        <TripNotices />

        {lead ? (
          <>
            <div className="flex flex-col gap-5">
              <LeadTrip trip={lead.trip} stats={lead.stats} stacked={others.length} />
              <NewTripCard />
            </div>

            {others.length > 0 && (
              <section aria-label="Other ongoing trips" className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-extrabold">Other ongoing trips</h2>
                  <button className="text-sm font-bold text-accent" onClick={() => navigate('/trips')}>
                    See all
                  </button>
                </div>
                {others.slice(0, 3).map(({ trip, stats }, i) => (
                  <TripCard key={trip.id} trip={trip} stats={stats} index={i + 1} />
                ))}
              </section>
            )}

            <section aria-label="Quick overview" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-lg font-extrabold">Quick overview</h2>
                <span className="text-xs font-semibold text-mute">{lead.trip.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryTile
                  icon={Receipt}
                  label="Total expenses"
                  value={formatMoney(lead.stats.total, lead.trip.currencyCode)}
                  hint={`${lead.stats.expenseCount} ${lead.stats.expenseCount === 1 ? 'entry' : 'entries'}`}
                />
                <SummaryTile
                  icon={Users}
                  label="Average per member"
                  value={formatMoney(lead.stats.equalShare, lead.trip.currencyCode)}
                  hint="Total ÷ members, for reference. Settlement uses actual shares."
                />
                <SummaryTile icon={ArrowUpRight} label="Need to pay" value={`${owing} ${owing === 1 ? 'member' : 'members'}`} tone="!bg-neg-soft" />
                <SummaryTile icon={ArrowDownLeft} label="Should receive" value={`${owed} ${owed === 1 ? 'member' : 'members'}`} tone="!bg-pos-soft" />
              </div>
            </section>

            {trend.length >= 2 && (
              <section aria-label="Spending trend" className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-base font-extrabold">Spending trend</h2>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-deep">
                    {formatDate(trend[0].at).replace(/ \d{4}$/, '')} – {formatDate(trend[trend.length - 1].at).replace(/ \d{4}$/, '')}
                  </span>
                </div>
                <SparkChart points={trend} currency={lead.trip.currencyCode} />
              </section>
            )}
          </>
        ) : (
          <section className="overflow-hidden rounded-[30px] bg-mint p-5 shadow-card">
            <FriendsHero className="mx-auto mb-4 w-full max-w-[320px]" />
            <h2 className="text-[26px] font-extrabold leading-[1.12]">
              {trips.length === 0 ? 'Your next adventure starts here.' : 'No trip in progress.'}
            </h2>
            <p className="mb-5 mt-2 text-[15px] font-medium leading-relaxed text-ink/70">
              {trips.length === 0
                ? 'Create a trip, add your friends once, and log every expense as you go.'
                : 'Start a new trip and split the costs as you go.'}
            </p>
            <button onClick={() => navigate('/new')} className="btn-primary h-14 w-full text-base">
              <Plus size={22} strokeWidth={2.6} /> {trips.length === 0 ? 'Create Your First Trip' : 'Start a New Trip'}
            </button>
          </section>
        )}

        {completed.length > 0 && (
          <section aria-label="Completed trips" className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-extrabold">Completed trips</h2>
              {completed.length > SHOWN_COMPLETED && (
                <button className="text-sm font-bold text-accent" onClick={() => navigate('/trips')}>
                  See all ({completed.length})
                </button>
              )}
            </div>
            {completed.slice(0, SHOWN_COMPLETED).map(({ trip, stats }, i) => (
              <TripCard key={trip.id} trip={trip} stats={stats} index={i} />
            ))}
          </section>
        )}

        <section aria-label="Recent activity" className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold">Recent activity</h2>
            {activity.length > 0 && (
              <button className="flex items-center gap-0.5 text-sm font-bold text-accent" onClick={() => navigate('/activity')}>
                View All <ChevronRight size={15} />
              </button>
            )}
          </div>
          {activity.length > 0 ? (
            <div className="card p-1.5">
              {activity.map((event) => (
                <ActivityRow key={event.key} event={event} />
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                illustration={<AdventureScene className="w-full" />}
                title="Nothing here yet"
                text="Expenses you add will show up here."
              />
            </div>
          )}
        </section>

        <InstallCard />
      </Page>
      <BottomNav />
    </>
  )
}
