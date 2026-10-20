import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, FileSpreadsheet, Flag, PartyPopper, Receipt, RotateCcw, Share2, Users, Wallet } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { formatINR } from '../lib/currency.js'
import { formatDate } from '../lib/dates.js'
import { exportTripCsv, settlementText, shareText } from '../lib/exporters.js'
import { touch } from '../lib/model.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar, BalanceBadge, SignedAmount } from '../components/ui.jsx'

export default function Settlement({ tripId }) {
  const { trips, updateTrip } = useTrips()
  const toast = useToast()
  const [confirmFinish, setConfirmFinish] = useState(false)
  const trip = trips.find((t) => t.id === tripId)
  const stats = useMemo(() => (trip ? computeTripStats(trip) : null), [trip])

  if (!trip) {
    return (
      <>
        <PageHeader title="Settlement" backTo="/" />
        <Page>
          <EmptyState
            icon={Wallet}
            title="Trip not found"
            text="It may have been deleted."
            action={
              <button className="btn-primary" onClick={() => navigate('/', { replace: true })}>
                Back to home
              </button>
            }
          />
        </Page>
      </>
    )
  }

  const completed = trip.status === 'completed'
  const index = (id) => trip.members.findIndex((m) => m.id === id)
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'

  const onShare = async () => {
    const result = await shareText(`${trip.name} - Apna Apna`, settlementText(trip, stats))
    if (result === 'copied') toast('Summary copied to clipboard')
    else if (result === 'failed') toast('Could not share the summary', 'error')
  }

  return (
    <>
      <PageHeader title="Settlement" subtitle={trip.name} backTo={`/trip/${tripId}`} />
      <Page className="flex flex-col gap-6">
        <section aria-label="Trip summary" className="hero-grad rounded-[32px] p-6 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            {completed ? (
              <CheckCircle2 size={20} className="text-pos" />
            ) : (
              <Flag size={20} className="text-brand" />
            )}
            <p className="text-sm font-extrabold">
              {completed ? 'Trip Completed' : 'Trip still ongoing'}
              {completed && trip.completedAt ? (
                <span className="font-medium text-ink/60"> · {formatDate(trip.completedAt)}</span>
              ) : null}
            </p>
          </div>
          <p className="text-sm font-semibold text-ink/70">Total trip expense</p>
          <p className="mb-4 mt-1 text-[44px] font-extrabold leading-none tabular-nums tracking-tight">
            {formatINR(stats.total)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur">
              <p className="text-xs font-semibold text-mute">Equal share each</p>
              <p className="text-lg font-extrabold tabular-nums">{formatINR(stats.equalShare)}</p>
            </div>
            <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-mute">
                <Users size={13} /> Members
              </p>
              <p className="text-lg font-extrabold">{stats.memberCount}</p>
            </div>
          </div>
          {!completed && (
            <p className="mt-4 text-xs font-medium text-ink/70">
              This is a live preview and updates as expenses change.
            </p>
          )}
        </section>

        <section aria-label="Member balances" className="flex flex-col gap-3">
          <h2 className="section-title px-1">Member balances</h2>
          {stats.rows.map((r) => {
            const accent = r.balance > 0 ? 'border-l-pos' : r.balance < 0 ? 'border-l-neg' : 'border-l-line'
            return (
              <div key={r.id} className={`card border-l-[5px] p-4 ${accent}`}>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar name={r.name} index={index(r.id)} size={42} />
                  <p className="min-w-0 flex-1 truncate font-bold">{r.name}</p>
                  <BalanceBadge balance={r.balance} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-sunken p-3.5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-mute">Total paid</dt>
                    <dd className="font-bold tabular-nums">{formatINR(r.paid)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-mute">Allocated expense share</dt>
                    <dd className="font-bold tabular-nums">{formatINR(r.allocated)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-mute">Overall equal share</dt>
                    <dd className="font-bold tabular-nums">{formatINR(r.equalShare)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-mute">Final balance</dt>
                    <dd>
                      <SignedAmount balance={r.balance} className="text-base" />
                    </dd>
                  </div>
                </dl>
              </div>
            )
          })}
          <p className="px-1 text-xs leading-relaxed text-mute">
            Final balance = amount paid − overall equal share. The overall equal share is the total of {formatINR(stats.total)}{' '}
            divided by all {stats.memberCount} members. Balances add up to {formatINR(stats.balanceSum)}.
          </p>
        </section>

        <section aria-label="Settlement plan" className="flex flex-col gap-3">
          <h2 className="section-title px-1">Settlement plan</h2>
          {stats.expenseCount === 0 ? (
            <div className="card p-5 text-center text-sm text-mute">No expenses were recorded, so nobody owes anything.</div>
          ) : stats.settlements.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pos-soft text-pos">
                <PartyPopper size={28} />
              </div>
              <p className="text-lg font-extrabold">Everyone is settled</p>
              <p className="text-sm text-mute">Nobody owes anybody. Nicely done.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.settlements.map((s, i) => (
                <li key={`${s.from}-${s.to}-${i}`} className="card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex w-16 flex-col items-center gap-1">
                      <Avatar name={nameOf(s.from)} index={index(s.from)} size={44} />
                      <span className="max-w-full truncate text-xs font-bold">{nameOf(s.from)}</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[22px] font-extrabold tabular-nums tracking-tight text-neg">
                        {formatINR(s.amount)}
                      </span>
                      <span className="flex w-full items-center text-mute">
                        <span className="h-0 flex-1 border-t-2 border-dashed border-line" />
                        <ArrowRight size={18} className="-ml-1 shrink-0" />
                      </span>
                    </div>
                    <div className="flex w-16 flex-col items-center gap-1">
                      <Avatar name={nameOf(s.to)} index={index(s.to)} size={44} />
                      <span className="max-w-full truncate text-xs font-bold">{nameOf(s.to)}</span>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-center text-sm">
                    <span className="font-bold">{nameOf(s.from)}</span> pays <span className="font-bold">{nameOf(s.to)}</span>{' '}
                    <span className="font-bold tabular-nums">{formatINR(s.amount)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary col-span-2" onClick={onShare}>
            <Share2 size={18} /> Share settlement summary
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              exportTripCsv(trip, stats)
              toast('CSV downloaded')
            }}
          >
            <FileSpreadsheet size={18} /> CSV
          </button>
          <button className="btn-outline" onClick={() => navigate(`/trip/${tripId}`)}>
            <Receipt size={18} /> Expenses
          </button>
          {completed ? (
            <button
              className="btn-soft col-span-2"
              onClick={() => {
                updateTrip(tripId, (t) => touch(t, { status: 'ongoing', completedAt: null }))
                toast('Trip reopened')
                navigate(`/trip/${tripId}`, { replace: true })
              }}
            >
              <RotateCcw size={18} /> Reopen Trip
            </button>
          ) : (
            <button className="btn-soft col-span-2" onClick={() => setConfirmFinish(true)}>
              <Flag size={18} /> Finish Trip
            </button>
          )}
        </div>
      </Page>

      <ConfirmDialog
        open={confirmFinish}
        title="Finish this trip?"
        message="The trip will be marked as completed. You can reopen it later to make corrections."
        confirmLabel="Finish trip"
        onConfirm={() => {
          updateTrip(tripId, (t) => touch(t, { status: 'completed', completedAt: Date.now() }))
          setConfirmFinish(false)
          toast('Trip completed')
        }}
        onCancel={() => setConfirmFinish(false)}
      />
    </>
  )
}
