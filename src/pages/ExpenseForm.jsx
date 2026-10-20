import { useMemo, useRef, useState } from 'react'
import { CalendarClock, Check, Flag, RotateCcw } from 'lucide-react'
import { goBack, navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { formatINR, paiseToInput, toPaise } from '../lib/currency.js'
import { formatDateTime } from '../lib/dates.js'
import { allocateExpense } from '../lib/calculations.js'
import { createExpense, editExpense, touch } from '../lib/model.js'
import { validateExpense } from '../lib/validation.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar, FieldError } from '../components/ui.jsx'

const SUGGESTIONS = ['Petrol', 'Hotel', 'Food', 'Tickets', 'Shopping', 'Taxi', 'Other']

/** Keep digits and a single decimal point, at most 2 decimals. */
function cleanAmountInput(value) {
  let v = value.replace(/[^\d.]/g, '')
  const dot = v.indexOf('.')
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  return v.replace(/^0+(?=\d)/, '').slice(0, 13)
}

export default function ExpenseForm({ tripId, expenseId }) {
  const { trips, updateTrip } = useTrips()
  const toast = useToast()
  const submitting = useRef(false)
  const trip = trips.find((t) => t.id === tripId)
  const existing = expenseId ? trip?.expenses.find((e) => e.id === expenseId) : null
  const editing = Boolean(expenseId)
  const backTo = trip ? (editing ? `/trip/${tripId}/expense/${expenseId}` : `/trip/${tripId}`) : '/'

  const [title, setTitle] = useState(existing?.title ?? '')
  const [amountInput, setAmountInput] = useState(existing ? paiseToInput(existing.amount) : '')
  const [payerId, setPayerId] = useState(existing?.payerId ?? '')
  const [participantIds, setParticipantIds] = useState(
    () => existing?.participantIds ?? trip?.members.map((m) => m.id) ?? [],
  )
  const [errors, setErrors] = useState({})
  const [openedAt] = useState(() => Date.now())
  const recordedAt = existing?.createdAt ?? openedAt

  const memberIds = useMemo(() => trip?.members.map((m) => m.id) ?? [], [trip])
  const amount = toPaise(amountInput)
  const preview = useMemo(() => {
    if (!trip || !amount || !participantIds.length) return null
    const alloc = allocateExpense(amount, participantIds, trip.members)
    const values = Object.values(alloc)
    return { each: Math.max(...values), uneven: new Set(values).size > 1 }
  }, [trip, amount, participantIds])

  if (!trip || (editing && !existing)) {
    return (
      <>
        <PageHeader title="Not found" backTo="/" />
        <Page>
          <EmptyState
            icon={Flag}
            title="Nothing to show here"
            text="This trip or expense no longer exists."
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

  if (trip.status === 'completed') {
    return (
      <>
        <PageHeader title={editing ? 'Edit expense' : 'Add expense'} backTo={`/trip/${tripId}`} />
        <Page>
          <EmptyState
            icon={Flag}
            title="This trip is completed"
            text="Reopen the trip if you need to add or change expenses. Settlement updates automatically."
            action={
              <button
                className="btn-primary"
                onClick={() => {
                  updateTrip(tripId, (t) => touch(t, { status: 'ongoing', completedAt: null }))
                  toast('Trip reopened')
                }}
              >
                <RotateCcw size={18} /> Reopen trip
              </button>
            }
          />
        </Page>
      </>
    )
  }

  const clearError = (key) => setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p))

  const toggleParticipant = (id) => {
    clearError('participants')
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const allSelected = participantIds.length === memberIds.length
  const toggleAll = () => {
    clearError('participants')
    setParticipantIds(allSelected ? [] : memberIds)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (submitting.current) return
    const result = validateExpense({ title, amountInput, payerId, participantIds, memberIds })
    setErrors(result.errors)
    if (!result.ok) {
      // Save sits at the bottom, errors can be off-screen: say so and scroll to the first one.
      toast(Object.values(result.errors)[0], 'error')
      requestAnimationFrame(() =>
        document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      )
      return
    }
    submitting.current = true // guards against double taps until we leave this screen
    const values = { title, amount: result.amount, payerId, participantIds }
    if (editing) {
      updateTrip(tripId, (t) => ({
        ...t,
        expenses: t.expenses.map((x) => (x.id === expenseId ? editExpense(t, x, values) : x)),
      }))
      toast('Expense updated')
    } else {
      updateTrip(tripId, (t) => ({ ...t, expenses: [...t.expenses, createExpense(t, values)] }))
      toast('Expense saved')
    }
    goBack(backTo)
  }

  return (
    <>
      <PageHeader title={editing ? 'Edit expense' : 'Add expense'} subtitle={trip.name} backTo={backTo} />
      <Page>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="card p-5">
            <label htmlFor="exp-title" className="label">
              What was it for?
            </label>
            <input
              id="exp-title"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Petrol"
              value={title}
              maxLength={60}
              autoComplete="off"
              autoFocus={!editing}
              onChange={(e) => {
                setTitle(e.target.value)
                clearError('title')
              }}
              aria-invalid={Boolean(errors.title)}
            />
            <FieldError>{errors.title}</FieldError>
            <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Quick titles">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip shrink-0 ${title.trim().toLowerCase() === s.toLowerCase() ? 'chip-on' : ''}`}
                  onClick={() => {
                    setTitle(s)
                    clearError('title')
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <label htmlFor="exp-amount" className="label">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-mute">
                ₹
              </span>
              <input
                id="exp-amount"
                className={`input !pl-10 text-2xl font-extrabold tabular-nums ${errors.amount ? 'input-error' : ''}`}
                inputMode="decimal"
                placeholder="0"
                value={amountInput}
                autoComplete="off"
                onChange={(e) => {
                  setAmountInput(cleanAmountInput(e.target.value))
                  clearError('amount')
                }}
                aria-invalid={Boolean(errors.amount)}
              />
            </div>
            <FieldError>{errors.amount}</FieldError>
          </div>

          <fieldset className="card p-5">
            <legend className="label float-left">Paid by</legend>
            <div className="clear-both" />
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paid by">
              {trip.members.map((m, i) => {
                const on = payerId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`chip !pl-1.5 ${on ? 'chip-on' : ''}`}
                    onClick={() => {
                      setPayerId(m.id)
                      clearError('payer')
                    }}
                  >
                    <Avatar name={m.name} index={i} size={28} />
                    {m.name}
                  </button>
                )
              })}
            </div>
            <FieldError>{errors.payer}</FieldError>
          </fieldset>

          <fieldset className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <legend className="label !mb-0">Split between</legend>
              <button type="button" className="text-sm font-semibold text-brand" onClick={toggleAll}>
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Participants">
              {trip.members.map((m, i) => {
                const on = participantIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    className={`chip !pl-1.5 ${on ? 'chip-on' : ''}`}
                    onClick={() => toggleParticipant(m.id)}
                  >
                    <Avatar name={m.name} index={i} size={28} />
                    {m.name}
                    {on && <Check size={16} />}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-sm text-mute">
              {participantIds.length} of {memberIds.length} selected
            </p>
            <FieldError>{errors.participants}</FieldError>
          </fieldset>

          {preview && (
            <div className="rounded-2xl bg-brand-soft p-4 text-sm text-brand" aria-live="polite">
              <p className="font-bold">
                {formatINR(amount)} split {participantIds.length === 1 ? 'to 1 person' : `between ${participantIds.length}`}
              </p>
              <p>
                {preview.uneven ? 'About ' : ''}
                {formatINR(preview.each)} each
                {preview.uneven ? '. Leftover paise are shared out so the total stays exact.' : ''}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl bg-surface/80 p-4 text-sm shadow-card">
            <CalendarClock size={20} className="shrink-0 text-brand" />
            <div>
              <p className="font-bold">{formatDateTime(recordedAt)}</p>
              <p className="text-xs text-mute">
                {editing
                  ? 'Originally recorded. This stays the same when you edit.'
                  : 'Date and time are recorded automatically when you save.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-outline" onClick={() => goBack(backTo)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editing ? 'Save changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Page>
    </>
  )
}
