import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Flag, RotateCcw, Share2, Wallet } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { formatMoney } from '../lib/currency.js'
import { formatDate } from '../lib/dates.js'
import { exportTripCsv, settlementText, shareText } from '../lib/exporters.js'
import { touch } from '../lib/model.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ReceiptIllustration } from '../components/illustrations.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { MemberAvatar } from '../components/MemberAvatar.jsx'
import { TripThumbnail } from '../components/TripThumbnail.jsx'
import { BalanceBadge, LeftTag, SignedAmount } from '../components/ui.jsx'

function StatTile({ value, label }) {
  return (
    <div className="card p-4">
      <p className="text-[32px] font-semibold leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-sm font-medium text-mute">{label}</p>
    </div>
  )
}

/**
 * One screen for both "Current Status" (trip ongoing) and "Final Settlement"
 * (trip completed). Both run the same computeTripStats, so for the same data
 * the balances and the who-pays-whom plan are identical.
 */
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
  const money = (n) => formatMoney(n, trip.currencyCode)
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'

  const onShare = async () => {
    const result = await shareText(`${trip.name} - Apna Apna`, settlementText(trip, stats))
    if (result === 'copied') toast('Summary copied to clipboard')
    else if (result === 'failed') toast('Could not share the summary', 'error')
  }

  return (
    <>
      <PageHeader
        title={trip.name}
        subtitle={`${trip.currencyCode} · ${completed ? 'Completed' : 'Ongoing'}`}
        backTo={`/trip/${tripId}`}
      />
      <Page className="flex flex-col gap-6">
        <div>
          <h1 className="text-[40px] font-semibold leading-[1.02]">{completed ? 'Final Settlement' : 'Current Status'}</h1>
          <p className="mt-2 text-[15px] font-medium text-mute">
            {completed
              ? `Completed${trip.completedAt ? ` on ${formatDate(trip.completedAt)}` : ''}. Final balances and who pays whom.`
              : 'Live balances. Looking here does not finish the trip.'}
          </p>
        </div>

        <section aria-label="Trip summary" className="flex flex-col gap-3">
          <div className="hero-grad relative rounded-[28px] p-5 shadow-card">
            <TripThumbnail trip={trip} size={52} className="absolute right-4 top-4" />
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-bold text-bg">{trip.currencyCode}</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {completed ? <CheckCircle2 size={16} className="text-pos" /> : <Flag size={16} />}
                {completed ? 'Trip completed' : 'Trip ongoing'}
              </span>
            </div>
            <p className="text-sm font-semibold text-ink/70">Total trip expense</p>
            <p className="mt-1 text-[44px] font-semibold leading-none tabular-nums tracking-tight">{money(stats.total)}</p>
            {stats.equalShareMeaningful && (
              <p className="mt-3 text-xs font-medium text-ink/70">
                For reference, an even split of everything would be {money(stats.equalShare)} each. Balances below use the
                actual shares of each expense.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatTile value={stats.expenseCount} label="Expense entries" />
            <StatTile value={stats.activeCount} label="Active members" />
            <StatTile value={stats.leftCount} label="Members who left" />
            <StatTile value={stats.settlements.length} label="Payments to settle" />
          </div>
        </section>

        <section aria-label="Member balances" className="flex flex-col gap-3">
          <h2 className="section-title px-1">Member balances</h2>
          {stats.rows.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="mb-3 flex items-center gap-3">
                <MemberAvatar member={r} size={42} />
                <p className="flex min-w-0 flex-1 items-center gap-2 font-semibold">
                  <span className="truncate">{r.name}</span>
                  {!r.active && <LeftTag />}
                </p>
                <BalanceBadge balance={r.balance} />
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-3 rounded-2xl bg-sunken p-3.5 text-sm">
                <div>
                  <dt className="text-xs font-medium text-mute">Total paid</dt>
                  <dd className="font-semibold tabular-nums">{money(r.paid)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-mute">Expense share</dt>
                  <dd className="font-semibold tabular-nums">{money(r.allocated)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-mute">Balance</dt>
                  <dd>
                    <SignedAmount balance={r.balance} currency={trip.currencyCode} className="text-base" />
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          <p className="px-1 text-xs leading-relaxed text-mute">
            Balance = total paid − expense share. Only the people selected for an expense share its cost, and members who
            joined later or left earlier are counted only for the expenses they were part of. Balances add up to{' '}
            {money(stats.balanceSum)}.
          </p>
        </section>

        <section aria-label="Who pays whom" className="flex flex-col gap-3">
          <h2 className="section-title px-1">Who pays whom</h2>
          {stats.expenseCount === 0 ? (
            <div className="card p-5 text-center text-sm text-mute">No expenses recorded yet, so nobody owes anything.</div>
          ) : stats.settlements.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-6 text-center">
              <ReceiptIllustration className="w-44" />
              <p className="text-lg font-bold">Everyone is settled</p>
              <p className="text-sm text-mute">Nobody owes anybody. Nicely done.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.settlements.map((s, i) => (
                <li key={`${s.from}-${s.to}-${i}`} className="card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex w-16 flex-col items-center gap-1">
                      <MemberAvatar member={stats.byId[s.from]} size={44} />
                      <span className="max-w-full truncate text-xs font-bold">{nameOf(s.from)}</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[22px] font-bold tabular-nums tracking-tight text-neg">
                        {money(s.amount)}
                      </span>
                      <span className="flex w-full items-center text-mute">
                        <span className="h-0 flex-1 border-t-2 border-dashed border-line" />
                        <ArrowRight size={18} className="-ml-1 shrink-0" />
                      </span>
                    </div>
                    <div className="flex w-16 flex-col items-center gap-1">
                      <MemberAvatar member={stats.byId[s.to]} size={44} />
                      <span className="max-w-full truncate text-xs font-bold">{nameOf(s.to)}</span>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-center text-sm">
                    <span className="font-bold">{nameOf(s.from)}</span> pays <span className="font-bold">{nameOf(s.to)}</span>{' '}
                    <span className="font-bold tabular-nums">{money(s.amount)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {stats.settlements.length > 0 && (
            <p className="px-1 text-xs leading-relaxed text-mute">
              This plan settles everyone with a small number of payments. It is a practical suggestion, not always the
              absolute minimum.
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary col-span-2" onClick={onShare}>
            <Share2 size={18} /> Share {completed ? 'settlement' : 'status'} summary
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
          <button className="btn-outline whitespace-nowrap" onClick={() => navigate(`/trip/${tripId}`)}>
            <ArrowLeft size={18} /> Back to Trip
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
        message="The trip will be marked as completed and you will see the final settlement. You can reopen it later to make corrections."
        confirmLabel="Finish trip"
        onConfirm={() => {
          updateTrip(tripId, (t) => touch(t, { status: 'completed', completedAt: Date.now() }))
          setConfirmFinish(false)
          toast('Trip completed')
          navigate(`/trip/${tripId}/settlement`, { replace: true })
        }}
        onCancel={() => setConfirmFinish(false)}
      />
    </>
  )
}
