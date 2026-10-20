import { useMemo, useState } from 'react'
import {
  ArrowRight,
  FileJson,
  FileSpreadsheet,
  Flag,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { computeBreakdown, computeTripStats } from '../lib/calculations.js'
import { formatINR } from '../lib/currency.js'
import { exportBackupJson, exportTripCsv, settlementText, shareText } from '../lib/exporters.js'
import { sortExpensesNewestFirst, touch } from '../lib/model.js'
import { nameKey, validateMemberName } from '../lib/validation.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ExpenseItem } from '../components/ExpenseItem.jsx'
import { IconButton, Page, PageHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog, Sheet } from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'
import { Avatar, ContributionBar, FieldError, SignedAmount, StatusBadge } from '../components/ui.jsx'
import { TripNotices } from '../components/TripNotices.jsx'

const RECENT_COUNT = 5

function MemberRow({ member, index, row, onRename, canEdit }) {
  const label = row.balance > 0 ? 'to receive' : row.balance < 0 ? 'to pay' : 'settled'
  return (
    <div className="flex items-center gap-3 p-3">
      <Avatar name={member.name} index={index} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{member.name}</p>
        <p className="text-[13px] text-mute">
          Paid <span className="font-semibold tabular-nums text-ink">{formatINR(row.paid)}</span>
        </p>
      </div>
      <div className="text-right">
        <SignedAmount balance={row.balance} className="text-[17px]" />
        <p className="text-xs font-medium text-mute">{label}</p>
      </div>
      {canEdit && (
        <button
          onClick={onRename}
          aria-label={`Rename ${member.name}`}
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mute transition hover:bg-sunken"
        >
          <Pencil size={15} />
        </button>
      )}
    </div>
  )
}

export default function Dashboard({ tripId }) {
  const { trips, updateTrip, removeTrip } = useTrips()
  const toast = useToast()
  const trip = trips.find((t) => t.id === tripId)

  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'finish' | 'delete' | 'reopen'
  const [renaming, setRenaming] = useState(null) // member
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')

  const stats = useMemo(() => (trip ? computeTripStats(trip) : null), [trip])
  const breakdown = useMemo(() => (trip ? computeBreakdown(trip.expenses) : []), [trip])

  if (!trip) {
    return (
      <>
        <PageHeader title="Trip not found" backTo="/" />
        <Page>
          <EmptyState
            icon={Wallet}
            title="We could not find this trip"
            text="It may have been deleted, or it lives on another device."
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
  const nameOf = (id) => stats.byId[id]?.name ?? 'Unknown'
  const sorted = sortExpensesNewestFirst(trip.expenses)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? sorted.filter((e) => e.title.toLowerCase().includes(q) || nameOf(e.payerId).toLowerCase().includes(q))
    : sorted
  const visible = q || showAll ? filtered : filtered.slice(0, RECENT_COUNT)

  const finish = () => {
    updateTrip(trip.id, (t) => touch(t, { status: 'completed', completedAt: Date.now() }))
    setConfirm(null)
    toast('Trip completed')
    navigate(`/trip/${trip.id}/settlement`)
  }
  const reopen = () => {
    updateTrip(trip.id, (t) => touch(t, { status: 'ongoing', completedAt: null }))
    setConfirm(null)
    toast('Trip reopened')
  }
  const remove = () => {
    removeTrip(trip.id)
    toast('Trip deleted')
    navigate('/', { replace: true })
  }

  const openRename = (member) => {
    setRenaming(member)
    setRenameValue(member.name)
    setRenameError('')
  }
  const saveRename = (e) => {
    e.preventDefault()
    const others = trip.members.filter((m) => m.id !== renaming.id).map((m) => m.name)
    const err = validateMemberName(renameValue, others)
    if (err) return setRenameError(err)
    const clean = renameValue.trim().replace(/\s+/g, ' ')
    updateTrip(trip.id, (t) => ({ ...t, members: t.members.map((m) => (m.id === renaming.id ? { ...m, name: clean } : m)) }))
    setRenaming(null)
    toast('Name updated')
  }

  const onShare = async () => {
    setMenuOpen(false)
    const result = await shareText(`${trip.name} - Apna Apna`, settlementText(trip, stats))
    if (result === 'copied') toast('Summary copied to clipboard')
    else if (result === 'failed') toast('Could not share the summary', 'error')
  }

  const menuItem = 'flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left font-semibold transition hover:bg-sunken'

  return (
    <>
      <PageHeader
        title={trip.name}
        subtitle={`${stats.memberCount} ${stats.memberCount === 1 ? 'member' : 'members'}`}
        badge={<StatusBadge status={trip.status} />}
        backTo="/"
        actions={
          <IconButton label="More options" onClick={() => setMenuOpen(true)}>
            <MoreVertical size={20} />
          </IconButton>
        }
      />
      <Page className="flex flex-col gap-6">
        <TripNotices />

        <section aria-label="Total trip expenses" className="hero-grad rounded-[32px] p-6 shadow-card">
          <p className="text-sm font-semibold text-ink/70">Total Trip Expenses</p>
          <p className="mb-4 mt-1 text-[44px] font-extrabold leading-none tabular-nums tracking-tight">
            {formatINR(stats.total)}
          </p>
          <div className="mb-4">
            <ContributionBar rows={stats.rows} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-mute">
                <Receipt size={13} /> Expenses
              </p>
              <p className="text-lg font-extrabold">{stats.expenseCount}</p>
            </div>
            <div className="rounded-2xl bg-surface/70 p-3.5 backdrop-blur">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-mute">
                <Users size={13} /> Equal share each
              </p>
              <p className="text-lg font-extrabold tabular-nums">{formatINR(stats.equalShare)}</p>
            </div>
          </div>
        </section>

        <section aria-label="Quick actions" className="flex flex-col gap-3">
          {completed ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-surface/80 p-4 text-sm shadow-card">
                <Flag size={20} className="shrink-0 text-brand" />
                <p className="font-medium text-mute">This trip is completed. Reopen it to add or change expenses.</p>
              </div>
              <div className="grid grid-cols-[1.35fr_1fr] gap-3">
                <button className="btn-primary h-14" onClick={() => navigate(`/trip/${trip.id}/settlement`)}>
                  View settlement <ArrowRight size={18} />
                </button>
                <button className="btn-outline h-14" onClick={() => setConfirm('reopen')}>
                  <RotateCcw size={17} /> Reopen
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-[1.35fr_1fr] gap-3">
              <button className="btn-primary h-14 text-base" onClick={() => navigate(`/trip/${trip.id}/add`)}>
                <Plus size={22} /> Add Expense
              </button>
              <button className="btn-outline h-14 whitespace-nowrap !px-3" onClick={() => setConfirm('finish')}>
                <Flag size={17} /> Finish Trip
              </button>
            </div>
          )}
        </section>

        <section aria-label="Members" className="flex flex-col gap-3">
          <h2 className="section-title px-1">Member summary</h2>
          <div className="card divide-y divide-line/60 p-1.5">
            {trip.members.map((m, i) => (
              <MemberRow
                key={m.id}
                member={m}
                index={i}
                row={stats.byId[m.id]}
                canEdit={!completed}
                onRename={() => openRename(m)}
              />
            ))}
          </div>
        </section>

        <section aria-label="Expenses" className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="section-title">{q || showAll ? 'All expenses' : 'Recent expenses'}</h2>
            {!q && filtered.length > RECENT_COUNT && (
              <button className="text-sm font-bold text-brand" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show less' : `View all (${filtered.length})`}
              </button>
            )}
          </div>

          {trip.expenses.length > 0 && (
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="search"
                className="input !pl-11"
                placeholder="Search by title or payer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search expenses"
              />
            </div>
          )}

          <div className="card p-1.5">
            {trip.expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses yet"
                text={completed ? 'This trip had no expenses.' : 'Add the first expense and it will show up here.'}
              />
            ) : visible.length === 0 ? (
              <p className="p-6 text-center text-sm text-mute">No expenses match &ldquo;{query}&rdquo;.</p>
            ) : (
              visible.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  payerName={nameOf(e.payerId)}
                  onClick={() => navigate(`/trip/${trip.id}/expense/${e.id}`)}
                />
              ))
            )}
          </div>
        </section>

        {breakdown.length > 0 && (
          <section aria-label="Expense breakdown" className="flex flex-col gap-3">
            <h2 className="section-title px-1">Where the money went</h2>
            <div className="card flex flex-col gap-4 p-5">
              {breakdown.map((b) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{b.label}</span>
                    <span className="shrink-0 tabular-nums text-mute">
                      {formatINR(b.amount)} · {Math.round(b.pct)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-mint"
                      style={{ width: `${Math.max(b.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </Page>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Trip options">
        <div className="flex flex-col">
          <button className={menuItem} onClick={() => { setMenuOpen(false); navigate(`/trip/${trip.id}/settlement`) }}>
            <Wallet size={20} className="text-brand" /> View settlement
          </button>
          <button className={menuItem} onClick={onShare}>
            <Share2 size={20} className="text-brand" /> Share settlement summary
          </button>
          <button className={menuItem} onClick={() => { exportTripCsv(trip, stats); setMenuOpen(false); toast('CSV downloaded') }}>
            <FileSpreadsheet size={20} className="text-brand" /> Export summary as CSV
          </button>
          <button className={menuItem} onClick={() => { exportBackupJson([trip], nameKey(trip.name).replace(/\W+/g, '-')); setMenuOpen(false); toast('Backup downloaded') }}>
            <FileJson size={20} className="text-brand" /> Download trip backup (JSON)
          </button>
          <button className={`${menuItem} text-neg`} onClick={() => { setMenuOpen(false); setConfirm('delete') }}>
            <Trash2 size={20} /> Delete trip
          </button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirm === 'finish'}
        title="Finish this trip?"
        message="The trip will be marked as completed and you will see who pays whom. You can reopen it later to make corrections."
        confirmLabel="Finish trip"
        onConfirm={finish}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'reopen'}
        title="Reopen this trip?"
        message="You will be able to add, edit and delete expenses again. The settlement is recalculated after every change."
        confirmLabel="Reopen trip"
        onConfirm={reopen}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this trip?"
        message={`"${trip.name}" and all ${trip.expenses.length} of its expenses will be permanently removed from this device. This cannot be undone. Download a backup first if you may need it.`}
        confirmLabel="Delete forever"
        danger
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />

      <Sheet open={Boolean(renaming)} onClose={() => setRenaming(null)} title="Rename member">
        <form onSubmit={saveRename} noValidate>
          <label htmlFor="rename" className="label">
            Name
          </label>
          <input
            id="rename"
            className={`input ${renameError ? 'input-error' : ''}`}
            value={renameValue}
            maxLength={40}
            autoFocus
            onChange={(e) => {
              setRenameValue(e.target.value)
              setRenameError('')
            }}
          />
          <FieldError>{renameError}</FieldError>
          <p className="mt-2 text-xs text-mute">Past expenses keep pointing to this person, so nothing breaks.</p>
          <button type="submit" className="btn-primary mt-5 w-full">
            Save name
          </button>
        </form>
      </Sheet>
    </>
  )
}
