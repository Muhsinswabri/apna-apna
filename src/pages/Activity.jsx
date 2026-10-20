import { useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { BottomNav } from '../components/BottomNav.jsx'
import { ActivityRow } from '../components/ActivityRow.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ReceiptIllustration } from '../components/illustrations.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { TripNotices } from '../components/TripNotices.jsx'
import { useTrips } from '../hooks/useTrips.jsx'
import { buildActivity } from '../lib/activity.js'
import { dayLabel } from '../lib/dates.js'

const PAGE_SIZE = 30

export default function Activity() {
  const { trips } = useTrips()
  const [tripId, setTripId] = useState(null)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const selected = trips.some((t) => t.id === tripId) ? tripId : null
  const events = useMemo(() => buildActivity(trips, { tripId: selected }), [trips, selected])
  const shown = events.slice(0, limit)

  // Group by calendar day, keeping the newest-first order.
  const groups = []
  for (const e of shown) {
    const label = dayLabel(e.at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(e)
    else groups.push({ label, items: [e] })
  }

  return (
    <>
      <header className="safe-top">
        <div className="relative mx-auto max-w-lg px-4 pb-1 pt-5">
          <div className="absolute right-4 top-5">
            <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
              <Settings size={19} />
            </IconButton>
          </div>
          <h1 className="text-[32px] font-extrabold leading-[1.08]">Activity</h1>
          <p className="mt-1.5 text-[14px] font-medium text-mute">Expenses, edits, deletions and members, newest first.</p>
        </div>
      </header>

      <Page nav className="flex flex-col gap-4">
        <TripNotices />

        {trips.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by trip">
            <button
              type="button"
              aria-pressed={!selected}
              className={`chip shrink-0 ${!selected ? 'chip-on' : ''}`}
              onClick={() => {
                setTripId(null)
                setLimit(PAGE_SIZE)
              }}
            >
              All trips
            </button>
            {trips.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected === t.id}
                className={`chip shrink-0 ${selected === t.id ? 'chip-on' : ''}`}
                onClick={() => {
                  setTripId(t.id)
                  setLimit(PAGE_SIZE)
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {events.length === 0 ? (
          <div className="card">
            <EmptyState
              illustration={<ReceiptIllustration className="w-full" />}
              title="No activity yet"
              text="Create a trip and add expenses, and everything that happens will be listed here."
            />
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label} className="flex flex-col gap-2">
                <h2 className="section-title px-1">{g.label}</h2>
                <div className="card p-1.5">
                  {g.items.map((event) => (
                    <ActivityRow key={event.key} event={event} showTrip={!selected} />
                  ))}
                </div>
              </section>
            ))}
            {events.length > shown.length && (
              <button className="btn-outline h-12" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                Show more ({events.length - shown.length})
              </button>
            )}
            <p className="px-1 text-xs leading-relaxed text-mute">
              Deleted expenses are listed from the moment this version of the app recorded them.
            </p>
          </>
        )}
      </Page>
      <BottomNav />
    </>
  )
}
