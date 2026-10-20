import { useMemo, useRef, useState } from 'react'
import { CalendarClock, Check, Flag, RotateCcw } from 'lucide-react'
import { goBack, navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { resolveCurrency } from '../lib/currencies.js'
import { formatMoney, minorToInput, toMinor } from '../lib/currency.js'
import { formatDateTime } from '../lib/dates.js'
import { allocateExpense } from '../lib/calculations.js'
import { createExpense, editExpense, eligibleForExpense, touch } from '../lib/model.js'
import { validateExpense } from '../lib/validation.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { Sheet } from '../components/Sheet.jsx'
import { TitleInput } from '../components/TitleInput.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar, FieldError } from '../components/ui.jsx'

const SUGGESTIONS = ['Petrol', 'Hotel', 'Food', 'Tickets', 'Shopping', 'Taxi', 'Other']
const CATEGORIES = ['Food', 'Stay', 'Travel', 'Fuel', 'Tickets', 'Shopping', 'Other']

/** Keep digits and (if the currency has decimals) a single decimal point. */
function cleanAmountInput(value, digits) {
  let v = value.replace(/[^\d.]/g, '')
  if (digits === 0) return v.replace(/\./g, '').replace(/^0+(?=\d)/, '').slice(0, 13)
  const dot = v.indexOf('.')
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, digits)
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

  const [openedAt] = useState(() => Date.now())
  const eligible = useMemo(() => (trip ? eligibleForExpense(trip, existing, openedAt) : []), [trip, existing, openedAt])
  const eligibleIds = useMemo(() => eligible.map((m) => m.id), [eligible])

  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [amountInput, setAmountInput] = useState(existing && trip ? minorToInput(existing.amount, trip.currencyCode) : '')
  const [payerId, setPayerId] = useState(existing?.payerId ?? '')
  // New expenses start with everyone currently on the trip selected.
  const [participantIds, setParticipantIds] = useState(() => existing?.participantIds ?? eligible.map((m) => m.id))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(null) // summary shown in the confirmation sheet
  const recordedAt = existing?.createdAt ?? openedAt

  const currency = resolveCurrency(trip?.currencyCode)
  const money = (n) => formatMoney(n, currency.code)
  const amount = toMinor(amountInput, currency.code)

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
  const allSelected = eligibleIds.every((id) => participantIds.includes(id))
  const toggleAll = () => {
    clearError('participants')
    setParticipantIds(allSelected ? [] : eligibleIds)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (submitting.current) return
    const result = validateExpense({ title, amountInput, currencyCode: currency.code, payerId, participantIds, eligibleIds })
    setErrors(result.errors)
    if (!result.ok) {
      // Save sits at the bottom, errors can be off-screen: say so and scroll to the first one.
      toast(Object.values(result.errors)[0], 'error')
      requestAnimationFrame(() =>
        document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      )
      return
    }
    submitting.current = true // guards against double taps until the sheet is dismissed
    const values = { title, category, amount: result.amount, payerId, participantIds }
    let expense = null
    let ok = false
    try {
      ok = updateTrip(tripId, (t) => {
        if (editing) {
          expense = editExpense(t, t.expenses.find((x) => x.id === expenseId), values)
          return { ...t, expenses: t.expenses.map((x) => (x.id === expenseId ? expense : x)) }
        }
        expense = createExpense(t, values)
        return { ...t, expenses: [...t.expenses, expense] }
      })
    } catch (err) {
      submitting.current = false
      toast(err.message || 'Could not save this expense', 'error')
      return
    }
    if (!ok) {
      // Never claim success when the device refused to store it.
      submitting.current = false
      toast('Could not save. Your device storage may be full.', 'error')
      return
    }
    setSaved({ expense, editing })
  }

  const done = () => goBack(backTo)

  const nameOf = (id) => trip.members.find((m) => m.id === id)?.name ?? 'Unknown'
  const savedAllocs = saved ? Object.entries(saved.expense.allocations) : []
  const savedEqual = saved ? new Set(savedAllocs.map(([, v]) => v)).size <= 1 : true
  const hasDeparted = trip.members.some((m) => m.leftAt)

  return (
    <>
      <PageHeader title={editing ? 'Edit expense' : 'Add expense'} subtitle={trip.name} backTo={backTo} />
      <Page>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="card p-5">
            <label htmlFor="exp-title" className="label">
              What was it for?
            </label>
            <TitleInput
              id="exp-title"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Petrol"
              value={title}
              maxLength={60}
              autoComplete="off"
              autoFocus={!editing}
              onChange={(v) => {
                setTitle(v)
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
              Amount <span className="font-semibold text-mute/70">({currency.code})</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-mute">
                {currency.symbol}
              </span>
              <input
                id="exp-amount"
                className={`input text-2xl font-bold tabular-nums ${errors.amount ? 'input-error' : ''}`}
                style={{ paddingLeft: `${Math.max(2.5, 1.2 + currency.symbol.length * 0.8)}rem` }}
                inputMode={currency.digits === 0 ? 'numeric' : 'decimal'}
                placeholder="0"
                value={amountInput}
                autoComplete="off"
                onChange={(e) => {
                  setAmountInput(cleanAmountInput(e.target.value, currency.digits))
                  clearError('amount')
                }}
                aria-invalid={Boolean(errors.amount)}
              />
            </div>
            <FieldError>{errors.amount}</FieldError>
          </div>

          <div className="card p-5">
            <label htmlFor="exp-category" className="label">
              Category <span className="font-semibold text-mute/70">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
              {CATEGORIES.map((c) => {
                const on = category.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    className={`chip ${on ? 'chip-on' : ''}`}
                    onClick={() => setCategory(on ? '' : c)}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
            <TitleInput
              id="exp-category"
              className="input mt-3"
              placeholder="Or type your own category"
              value={category}
              maxLength={30}
              autoComplete="off"
              onChange={setCategory}
            />
          </div>

          <fieldset className="card p-5">
            <legend className="label float-left">Paid by</legend>
            <div className="clear-both" />
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paid by">
              {eligible.map((m) => {
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
                    <Avatar name={m.name} index={trip.members.indexOf(m)} size={28} />
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
              <button type="button" className="text-sm font-semibold text-accent" onClick={toggleAll}>
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Participants">
              {eligible.map((m) => {
                const on = participantIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    className={`chip !pl-1.5 ${on ? 'chip-on' : ''}`}
                    onClick={() => toggleParticipant(m.id)}
                  >
                    <Avatar name={m.name} index={trip.members.indexOf(m)} size={28} />
                    {m.name}
                    {on && <Check size={16} />}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-sm font-semibold text-mute">
              {participantIds.length} of {eligible.length} selected
            </p>
            <p className="mt-1 text-xs text-mute">
              The person who paid does not have to be included. Only the people selected share this cost.
              {hasDeparted &&
                (editing
                  ? ' Only people who were on the trip when this was recorded are listed.'
                  : ' Members who have left the trip are not listed.')}
            </p>
            <FieldError>{errors.participants}</FieldError>
          </fieldset>

          {preview && (
            <div className="rounded-2xl bg-brand-soft p-4 text-sm text-accent" aria-live="polite">
              <p className="font-bold">
                {money(amount)} split {participantIds.length === 1 ? 'to 1 person' : `between ${participantIds.length}`}
              </p>
              <p>
                {preview.uneven ? 'About ' : ''}
                {money(preview.each)} {participantIds.length === 1 ? '' : 'each'}
                {preview.uneven ? '. Leftover amounts are shared out so the total stays exact.' : ''}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl bg-surface/80 p-4 text-sm shadow-card">
            <CalendarClock size={20} className="shrink-0 text-accent" />
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
            <button type="submit" className="btn-primary" disabled={Boolean(saved)}>
              {editing ? 'Save changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Page>

      <Sheet open={Boolean(saved)} onClose={done} title={saved?.editing ? 'Expense Updated' : 'Expense Added Successfully'}>
        {saved && (
          <>
            <dl className="mb-5 flex flex-col gap-3 rounded-2xl bg-sunken p-4 text-sm">
              <Row label="Expense" value={saved.expense.title} />
              {saved.expense.category && <Row label="Category" value={saved.expense.category} />}
              <Row label="Amount" value={money(saved.expense.amount)} strong />
              <Row label="Paid by" value={nameOf(saved.expense.payerId)} />
              <Row label="Participants" value={savedAllocs.map(([id]) => nameOf(id)).join(', ')} />
              {savedEqual ? (
                <Row
                  label="Share per participant"
                  value={`${money(savedAllocs[0][1])}${savedAllocs.length > 1 ? ' each' : ''}`}
                />
              ) : (
                <div>
                  <dt className="mb-1 text-mute">Shares (leftover shared out)</dt>
                  <dd className="flex flex-col gap-1">
                    {savedAllocs.map(([id, v]) => (
                      <span key={id} className="flex justify-between font-bold">
                        <span>{nameOf(id)}</span>
                        <span className="tabular-nums">{money(v)}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <Row label="Date and time" value={formatDateTime(saved.expense.createdAt)} />
            </dl>
            <button className="btn-primary w-full" onClick={done} autoFocus>
              Done
            </button>
          </>
        )}
      </Sheet>
    </>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-mute">{label}</dt>
      <dd className={`min-w-0 text-right ${strong ? 'text-base font-bold tabular-nums' : 'font-bold'}`}>{value}</dd>
    </div>
  )
}
