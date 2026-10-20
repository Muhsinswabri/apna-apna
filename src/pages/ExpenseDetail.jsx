import { useState } from 'react'
import { Pencil, Receipt, Trash2 } from 'lucide-react'
import { goBack, navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { formatINR } from '../lib/currency.js'
import { formatDateTime } from '../lib/dates.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar } from '../components/ui.jsx'

export default function ExpenseDetail({ tripId, expenseId }) {
  const { trips, updateTrip } = useTrips()
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const trip = trips.find((t) => t.id === tripId)
  const expense = trip?.expenses.find((e) => e.id === expenseId)

  if (!trip || !expense) {
    return (
      <>
        <PageHeader title="Expense" backTo={trip ? `/trip/${tripId}` : '/'} />
        <Page>
          <EmptyState
            icon={Receipt}
            title="Expense not found"
            text="It may have been deleted."
            action={
              <button className="btn-primary" onClick={() => navigate(trip ? `/trip/${tripId}` : '/', { replace: true })}>
                Go back
              </button>
            }
          />
        </Page>
      </>
    )
  }

  const completed = trip.status === 'completed'
  const indexOf = (id) => trip.members.findIndex((m) => m.id === id)
  const nameOf = (id) => trip.members[indexOf(id)]?.name ?? 'Unknown'
  const edited = expense.updatedAt - expense.createdAt > 1000

  const remove = () => {
    updateTrip(tripId, (t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) }))
    toast('Expense deleted')
    goBack(`/trip/${tripId}`)
  }

  return (
    <>
      <PageHeader title="Expense details" subtitle={trip.name} backTo={`/trip/${tripId}`} />
      <Page className="flex flex-col gap-5">
        <section className="card p-5">
          <p className="text-sm font-semibold text-mute">{expense.title}</p>
          <p className="mb-4 text-4xl font-extrabold tabular-nums tracking-tight">{formatINR(expense.amount)}</p>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-mute">Paid by</dt>
              <dd className="flex items-center gap-2 font-bold">
                <Avatar name={nameOf(expense.payerId)} index={indexOf(expense.payerId)} size={26} />
                {nameOf(expense.payerId)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Date and time</dt>
              <dd className="font-bold">{formatDateTime(expense.createdAt)}</dd>
            </div>
            {edited && (
              <div className="flex justify-between gap-3">
                <dt className="text-mute">Last edited</dt>
                <dd className="font-bold">{formatDateTime(expense.updatedAt)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Shared between</dt>
              <dd className="font-bold">
                {expense.participantIds.length} of {trip.members.length}
              </dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="section-title px-1">Each person&rsquo;s share</h2>
          <div className="card divide-y divide-line/60">
            {trip.members
              .filter((m) => expense.allocations[m.id] !== undefined)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3.5">
                  <Avatar name={m.name} index={indexOf(m.id)} size={36} />
                  <span className="flex-1 font-semibold">{m.name}</span>
                  <span className="font-bold tabular-nums">{formatINR(expense.allocations[m.id])}</span>
                </div>
              ))}
          </div>
        </section>

        {completed ? (
          <p className="rounded-2xl bg-sunken p-4 text-sm font-medium text-mute">
            This trip is completed. Reopen it from the trip page to edit or delete expenses.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-outline" onClick={() => navigate(`/trip/${tripId}/expense/${expenseId}/edit`)}>
              <Pencil size={18} /> Edit
            </button>
            <button className="btn-outline !text-neg" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </Page>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this expense?"
        message={`"${expense.title}" (${formatINR(expense.amount)}) will be permanently removed and all balances will be recalculated.`}
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
