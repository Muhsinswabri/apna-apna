import { useMemo, useRef, useState } from 'react'
import { Flag, LogOut, RotateCcw, UserPlus, Users } from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeTripStats } from '../lib/calculations.js'
import { formatMoney } from '../lib/currency.js'
import { formatDateTime } from '../lib/dates.js'
import { canRejoin } from '../lib/members.js'
import { addMember, markMemberLeft, rejoinMember, touch } from '../lib/model.js'
import { normalizeName } from '../lib/text.js'
import { MAX_MEMBERS, validateMemberName } from '../lib/validation.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Sheet.jsx'
import { TitleInput } from '../components/TitleInput.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar, FieldError, LeftTag, SignedAmount } from '../components/ui.jsx'

export default function Members({ tripId }) {
  const { trips, updateTrip } = useTrips()
  const toast = useToast()
  const busy = useRef(false)
  const trip = trips.find((t) => t.id === tripId)
  const stats = useMemo(() => (trip ? computeTripStats(trip) : null), [trip])

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(null) // member

  if (!trip) {
    return (
      <>
        <PageHeader title="Members" backTo="/" />
        <Page>
          <EmptyState
            icon={Users}
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
  const activeCount = stats.activeCount

  const run = (fn, okMessage) => {
    if (busy.current) return false
    busy.current = true
    try {
      const ok = updateTrip(trip.id, fn)
      if (!ok) {
        toast('Could not save. Your device storage may be full.', 'error')
        return false
      }
      if (okMessage) toast(okMessage)
      return true
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error')
      return false
    } finally {
      busy.current = false
    }
  }

  const onAdd = (e) => {
    e.preventDefault()
    const problem =
      trip.members.length >= MAX_MEMBERS
        ? `A trip can have up to ${MAX_MEMBERS} members`
        : validateMemberName(name, trip.members.map((m) => m.name))
    if (problem) return setError(problem)
    const added = normalizeName(name)
    if (run((t) => addMember(t, name), `${added} joined the trip`)) {
      setName('')
      setError('')
    }
  }

  const confirmLeave = () => {
    const member = leaving
    setLeaving(null)
    run((t) => markMemberLeft(t, member.id), `${member.name} marked as left`)
  }

  return (
    <>
      <PageHeader title="Manage members" subtitle={trip.name} backTo={`/trip/${tripId}`} />
      <Page className="flex flex-col gap-5">
        {completed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface/80 p-4 text-sm shadow-card">
            <Flag size={20} className="shrink-0 text-accent" />
            <p className="flex-1 font-medium text-mute">This trip is completed. Reopen it to add members or mark someone as left.</p>
            <button
              className="btn-soft btn-sm shrink-0"
              onClick={() => run((t) => touch(t, { status: 'ongoing', completedAt: null }), 'Trip reopened')}
            >
              <RotateCcw size={15} /> Reopen
            </button>
          </div>
        ) : (
          <form onSubmit={onAdd} noValidate className="card p-5">
            <label htmlFor="new-member" className="label">
              Add a member
            </label>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <TitleInput
                  id="new-member"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="Name"
                  value={name}
                  maxLength={40}
                  autoComplete="off"
                  onChange={(v) => {
                    setName(v)
                    setError('')
                  }}
                  aria-invalid={Boolean(error)}
                />
                <FieldError>{error}</FieldError>
              </div>
              <button type="submit" className="btn-primary h-[54px] shrink-0 !px-4">
                <UserPlus size={18} /> Add
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mute">
              New members share only the expenses recorded from the moment they join. Earlier expenses stay exactly as they were.
            </p>
          </form>
        )}

        <section className="flex flex-col gap-3" aria-label="Trip members">
          <h2 className="section-title px-1">
            {activeCount} active{stats.leftCount ? ` · ${stats.leftCount} left` : ''}
          </h2>
          <div className="card divide-y divide-line/60 p-1.5">
            {trip.members.map((m, i) => {
              const row = stats.byId[m.id]
              const left = Boolean(m.leftAt)
              return (
                <div key={m.id} className="flex flex-col gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} index={i} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-bold">
                        <span className="truncate">{m.name}</span>
                        {left && <LeftTag />}
                      </p>
                      <p className="text-xs text-mute">
                        Joined {formatDateTime(m.joinedAt)}
                        {left && <> · Left {formatDateTime(m.leftAt)}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      <SignedAmount balance={row.balance} currency={trip.currencyCode} className="text-[15px]" />
                      <p className="text-xs text-mute">paid {money(row.paid)}</p>
                    </div>
                  </div>
                  {!completed && !left && (
                    <button
                      className="btn-outline btn-sm self-start"
                      disabled={activeCount <= 1}
                      title={activeCount <= 1 ? 'At least one member must stay on the trip' : undefined}
                      onClick={() => setLeaving(m)}
                    >
                      <LogOut size={15} /> Mark as Left
                    </button>
                  )}
                  {!completed && left && canRejoin(trip, m) && (
                    <button
                      className="btn-soft btn-sm self-start"
                      onClick={() => run((t) => rejoinMember(t, m.id), `${m.name} is back on the trip`)}
                    >
                      <RotateCcw size={15} /> Undo — back on trip
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </Page>

      <ConfirmDialog
        open={Boolean(leaving)}
        title={`Mark ${leaving?.name ?? ''} as left?`}
        message="They will not be offered for new expenses. Everything they paid and shared so far stays, and any balance they have is still settled."
        confirmLabel="Mark as left"
        onConfirm={confirmLeave}
        onCancel={() => setLeaving(null)}
      />
    </>
  )
}
