// A feed of what happened, built only from data that is actually stored:
// expense timestamps, member join/leave times, trip dates and the
// removedExpenses list (the one thing we record when something is deleted).

const EDIT_GAP_MS = 1000 // an expense saved twice within a second is not an edit

/**
 * @typedef {{key: string, type: string, at: number, tripId: string, tripName: string,
 *   currencyCode: string, title: string, amount?: number, who?: string, expenseId?: string}} ActivityEvent
 */

/** @returns {ActivityEvent[]} newest first */
export function buildActivity(trips, { tripId = null, limit = Infinity } = {}) {
  const events = []
  for (const trip of trips) {
    if (tripId && trip.id !== tripId) continue
    const base = { tripId: trip.id, tripName: trip.name, currencyCode: trip.currencyCode }
    const nameOf = (id) => trip.members.find((m) => m.id === id)?.name ?? 'Someone'

    events.push({ ...base, key: `${trip.id}:created`, type: 'trip_created', at: trip.createdAt, title: trip.name })
    if (trip.status === 'completed' && trip.completedAt) {
      events.push({ ...base, key: `${trip.id}:completed`, type: 'trip_completed', at: trip.completedAt, title: trip.name })
    }
    for (const m of trip.members) {
      if (m.joinedAt > trip.createdAt + EDIT_GAP_MS) {
        events.push({ ...base, key: `${trip.id}:join:${m.id}`, type: 'member_joined', at: m.joinedAt, title: m.name, who: m.name })
      }
      if (m.leftAt) {
        events.push({ ...base, key: `${trip.id}:left:${m.id}`, type: 'member_left', at: m.leftAt, title: m.name, who: m.name })
      }
    }
    for (const e of trip.expenses) {
      const common = { ...base, title: e.title, amount: e.amount, who: nameOf(e.payerId), expenseId: e.id }
      events.push({ ...common, key: `${e.id}:added`, type: 'expense_added', at: e.createdAt })
      if (e.updatedAt - e.createdAt > EDIT_GAP_MS) {
        events.push({ ...common, key: `${e.id}:edited`, type: 'expense_edited', at: e.updatedAt })
      }
    }
    for (const d of trip.removedExpenses ?? []) {
      events.push({ ...base, key: `${d.id}:deleted`, type: 'expense_deleted', at: d.at, title: d.title, amount: d.amount, who: d.paidBy })
    }
  }
  events.sort((a, b) => b.at - a.at || a.key.localeCompare(b.key))
  return events.slice(0, limit)
}

/** Only the money events, for compact "recent activity" lists. */
export function recentExpenses(trips, limit = 5) {
  return buildActivity(trips).filter((e) => e.type === 'expense_added').slice(0, limit)
}
