import { useMemo, useState } from 'react'
import { BarChart3, Crown, Receipt, Settings, TrendingUp } from 'lucide-react'
import { BottomNav } from '../components/BottomNav.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ReceiptIllustration } from '../components/illustrations.jsx'
import { IconButton, Page } from '../components/PageHeader.jsx'
import { TripNotices } from '../components/TripNotices.jsx'
import { MemberAvatar } from '../components/MemberAvatar.jsx'
import { LeftTag } from '../components/ui.jsx'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { formatMoney } from '../lib/currency.js'
import { formatDate } from '../lib/dates.js'
import { computeInsights } from '../lib/insights.js'

function Tile({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold text-mute">
        <Icon size={14} /> {label}
      </p>
      <p className="mt-2 truncate text-[22px] font-extrabold leading-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 truncate text-[12px] font-medium text-mute">{hint}</p>}
    </div>
  )
}

export default function Insights() {
  const { trips } = useTrips()
  const [pickedId, setPickedId] = useState(null)

  // Default: the most recently updated ongoing trip, else the most recently updated trip.
  const ordered = useMemo(
    () =>
      [...trips].sort(
        (a, b) => Number(a.status === 'completed') - Number(b.status === 'completed') || b.updatedAt - a.updatedAt,
      ),
    [trips],
  )
  const trip = ordered.find((t) => t.id === pickedId) ?? ordered[0]
  const data = useMemo(() => (trip ? computeInsights(trip) : null), [trip])

  const header = (
    <header className="safe-top">
      <div className="relative mx-auto max-w-lg px-4 pb-1 pt-5">
          <div className="absolute right-4 top-5">
            <IconButton label="Settings and help" onClick={() => navigate('/settings')}>
              <Settings size={19} />
            </IconButton>
          </div>
        <h1 className="text-[32px] font-extrabold leading-[1.08]">Insights</h1>
        <p className="mt-1.5 text-[14px] font-medium text-mute">Where the money went, and who paid for it.</p>
      </div>
    </header>
  )

  if (!trip) {
    return (
      <>
        {header}
        <Page nav>
          <div className="card">
            <EmptyState
              illustration={<ReceiptIllustration className="w-full" />}
              title="No trips to analyse"
              text="Create a trip and add a few expenses to see spending breakdowns here."
              action={
                <button className="btn-primary" onClick={() => navigate('/new')}>
                  Start a New Trip
                </button>
              }
            />
          </div>
        </Page>
        <BottomNav />
      </>
    )
  }

  const money = (n) => formatMoney(n, trip.currencyCode)
  const maxDay = Math.max(1, ...data.daily.map((d) => d.amount))
  const maxMember = Math.max(1, ...data.members.map((m) => Math.max(m.paid, m.allocated)))

  return (
    <>
      {header}
      <Page nav className="flex flex-col gap-6">
        <TripNotices />

        {trips.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Choose a trip">
            {ordered.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === trip.id}
                className={`chip shrink-0 ${t.id === trip.id ? 'chip-on' : ''}`}
                onClick={() => setPickedId(t.id)}
              >
                {t.name}
                <span className={`text-xs ${t.id === trip.id ? 'opacity-80' : 'text-mute'}`}>{t.currencyCode}</span>
              </button>
            ))}
          </div>
        )}

        <section aria-label="Summary" className="flex flex-col gap-3">
          <div className="hero-grad rounded-[28px] p-5 shadow-card">
            <p className="text-xs font-bold text-mute">
              {trip.name} · {trip.currencyCode}
            </p>
            <p className="mt-1 text-[40px] font-extrabold leading-none tabular-nums tracking-tight">{money(data.total)}</p>
            <p className="mt-2 text-[13px] font-medium text-mute">
              Amounts are in {trip.currencyCode}. Trips are never added together.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile icon={Receipt} label="Expenses" value={data.count} hint={data.count ? `Avg ${money(data.average)} each` : 'None yet'} />
            <Tile
              icon={TrendingUp}
              label="Largest expense"
              value={data.largest ? money(data.largest.amount) : '—'}
              hint={data.largest?.title}
            />
          </div>
          {data.topPayer && (
            <div className="card flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint text-[#1F6B3E] dark:text-[#9BE3B4]">
                <Crown size={20} />
              </span>
              <p className="text-sm font-medium text-mute">
                <span className="font-extrabold text-ink">{data.topPayer.name}</span> paid the most:{' '}
                <span className="font-bold tabular-nums text-ink">{money(data.topPayer.paid)}</span>
              </p>
            </div>
          )}
        </section>

        {data.count === 0 ? (
          <div className="card p-6 text-center text-sm text-mute">Add an expense to see category, daily and member charts.</div>
        ) : (
          <>
            <section aria-label="By category" className="flex flex-col gap-3">
              <h2 className="text-lg font-extrabold">By category</h2>
              <div className="card flex flex-col gap-4 p-5">
                {data.categories.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-bold">{c.label}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-mute">
                        {money(c.amount)} · {Math.round(c.pct)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${c.label} ${Math.round(c.pct)} percent`}>
                      <div className="h-full rounded-full bg-purple" style={{ width: `${Math.max(c.pct, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section aria-label="Spending by day" className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <BarChart3 size={18} /> Spending by day
              </h2>
              <div className="card p-5">
                <div className="flex h-36 items-end gap-2" role="img" aria-label="Daily spending chart">
                  {data.daily.map((d) => (
                    <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                      <div
                        className="w-full rounded-t-lg bg-purple"
                        style={{ height: `${Math.max((d.amount / maxDay) * 100, 4)}%` }}
                        title={`${formatDate(d.at)}: ${money(d.amount)}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  {data.daily.map((d) => (
                    <span key={d.day} className="min-w-0 flex-1 truncate text-center text-[10px] font-semibold text-mute">
                      {formatDate(d.at).replace(/ \d{4}$/, '')}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium text-mute">Peak day: {money(maxDay)}</p>
              </div>
            </section>

            <section aria-label="By member" className="flex flex-col gap-3">
              <h2 className="text-lg font-extrabold">Paid vs. share</h2>
              <div className="card flex flex-col gap-5 p-5">
                {data.members.map((m, i) => (
                  <div key={m.id}>
                    <div className="mb-2 flex items-center gap-2.5">
                      <MemberAvatar member={m} size={32} />
                      <span className="flex min-w-0 flex-1 items-center gap-2 font-bold">
                        <span className="truncate">{m.name}</span>
                        {!m.active && <LeftTag />}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
                          <div className="h-full rounded-full bg-purple" style={{ width: `${(m.paid / maxMember) * 100}%` }} />
                        </div>
                        <span className="w-28 shrink-0 text-right text-xs font-semibold tabular-nums">Paid {money(m.paid)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
                          <div className="h-full rounded-full bg-[#91BFFF]" style={{ width: `${(m.allocated / maxMember) * 100}%` }} />
                        </div>
                        <span className="w-28 shrink-0 text-right text-xs font-semibold tabular-nums text-mute">
                          Share {money(m.allocated)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs leading-relaxed text-mute">
                  A member&rsquo;s share is the sum of their portion of every expense they took part in. The difference is
                  what they should receive or pay.
                </p>
              </div>
            </section>
          </>
        )}
      </Page>
      <BottomNav />
    </>
  )
}
