/**
 * Greedy settlement: repeatedly match the largest debtor with the largest
 * creditor and transfer the smaller of the two outstanding amounts.
 * Works on integer paise, so there is no floating-point drift.
 * Greedy gives a practical, small plan; it is not guaranteed to be the
 * mathematically minimum number of transfers.
 *
 * @param {Record<string, number>} balances memberId -> paise (+ receives, - owes)
 * @param {string[]} order stable member order used to break ties deterministically
 * @returns {{from: string, to: string, amount: number}[]}
 */
export function computeSettlements(balances, order = Object.keys(balances)) {
  const rank = new Map(order.map((id, i) => [id, i]))
  const byRank = (a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)

  const creditors = []
  const debtors = []
  for (const [id, bal] of Object.entries(balances)) {
    if (bal > 0) creditors.push({ id, amt: bal })
    else if (bal < 0) debtors.push({ id, amt: -bal })
  }
  const bySize = (a, b) => b.amt - a.amt || byRank(a, b)
  const transfers = []

  while (creditors.length && debtors.length) {
    creditors.sort(bySize)
    debtors.sort(bySize)
    const c = creditors[0]
    const d = debtors[0]
    const amount = Math.min(c.amt, d.amt)
    transfers.push({ from: d.id, to: c.id, amount })
    c.amt -= amount
    d.amt -= amount
    if (c.amt === 0) creditors.shift()
    if (d.amt === 0) debtors.shift()
  }
  return transfers
}
