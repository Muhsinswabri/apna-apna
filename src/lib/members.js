// Member participation timeline. A member takes part in the trip from
// `joinedAt` until `leftAt` (null while they are still on the trip).

export const isActive = (member) => !member.leftAt

/** Was this member on the trip at time `t`? */
export function isActiveAt(member, t) {
  return member.joinedAt <= t && (!member.leftAt || t < member.leftAt)
}

/** Members who may be payer or participant of an expense recorded at `t`. */
export function eligibleAt(trip, t = Date.now()) {
  return trip.members.filter((m) => isActiveAt(m, t))
}

export const activeMembers = (trip) => trip.members.filter(isActive)

/**
 * A member may rejoin only if nothing was recorded since they left,
 * otherwise their timeline would have a gap that expenses already fall into.
 */
export function canRejoin(trip, member) {
  if (!member.leftAt) return false
  return !trip.expenses.some((e) => e.createdAt >= member.leftAt)
}
