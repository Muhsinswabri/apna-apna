import { useMemo, useState } from 'react'
import { Plus, Search, Settings } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { BottomNav } from '../components/BottomNav.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { AdventureScene } from '../components/illustrations.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { TripCard } from '../components/TripCard.jsx'
import { TripNotices } from '../components/TripNotices.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
]

export default function Trips() {
  const { trips } = useTrips()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const rows = useMemo(
    () =>
      trips
        .map((trip) => ({ trip, stats: computeTripStats(trip) }))
        // Ongoing first, then most recently updated.
        .sort(
          (a, b) =>
            Number(a.trip.status === 'completed') - Number(b.trip.status === 'completed') ||
            b.trip.updatedAt - a.trip.updatedAt,
        ),
    [trips],
  )

  const counts = {
    all: rows.length,
    ongoing: rows.filter((r) => r.trip.status !== 'completed').length,
    completed: rows.filter((r) => r.trip.status === 'completed').length,
  }

  const needle = query.trim().toLowerCase()
  const visible = rows.filter(({ trip }) => {
    if (filter === 'ongoing' && trip.status === 'completed') return false
    if (filter === 'completed' && trip.status !== 'completed') return false
    return !needle || `${trip.name} ${trip.destination} ${trip.currencyCode}`.toLowerCase().includes(needle)
  })

  return (
    <>
      <header className="safe-top">
        <div className="relative mx-auto max-w-lg px-4 pb-1 pt-5">
          <div className="absolute right-4 top-5">
            <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
              <Settings size={19} />
            </IconButton>
          </div>
          <h1 className="text-[32px] font-extrabold leading-[1.08]">Your Trips</h1>
          <p className="mt-1.5 text-[14px] font-medium text-mute">Ongoing trips first, then your history.</p>
        </div>
      </header>

      <Page nav className="flex flex-col gap-4">
        <TripNotices />

        <button onClick={() => navigate('/new')} className="btn-primary h-14 w-full text-base">
          <Plus size={22} strokeWidth={2.6} /> Start New Trip
        </button>

        {rows.length > 0 && (
          <>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="search"
                className="input !pl-11"
                placeholder="Search by name, place or currency"
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search trips"
              />
            </div>
            <div className="flex gap-2" role="group" aria-label="Filter trips">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  className={`chip ${filter === f.id ? 'chip-on' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span className={`text-xs ${filter === f.id ? 'opacity-80' : 'text-mute'}`}>{counts[f.id]}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {rows.length === 0 ? (
          <div className="card">
            <EmptyState
              illustration={<AdventureScene className="w-full" />}
              title="No trips yet"
              text="Create your first trip and add your friends once."
            />
          </div>
        ) : visible.length === 0 ? (
          <p className="card p-6 text-center text-sm text-mute">
            {needle ? `No trips match "${query.trim()}".` : `No ${filter} trips.`}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map(({ trip, stats }, i) => (
              <TripCard key={trip.id} trip={trip} stats={stats} index={i} />
            ))}
          </div>
        )}
      </Page>
      <BottomNav />
    </>
  )
}
