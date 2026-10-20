import { describe, expect, it } from 'vitest'
import { allocateExpense, computeBreakdown, computeTripStats, splitEqual, sum } from './calculations.js'
import { createExpense, createTrip, editExpense } from './model.js'
import { computeSettlements } from './settlement.js'

const R = (n) => n * 100

function setup() {
  const trip = createTrip({ name: 'Wayanad', memberNames: ['Muhsin', 'Niyas', 'Musthafa', 'Rafi'] })
  const [m, n, u, r] = trip.members.map((x) => x.id)
  const add = (title, rupees, payerId, participantIds = trip.members.map((x) => x.id)) => {
    trip.expenses.push(createExpense(trip, { title, amount: R(rupees), payerId, participantIds }))
  }
  return { trip, ids: { m, n, u, r }, add }
}

describe('splitEqual', () => {
  it('splits evenly', () => {
    expect(splitEqual(400000, ['a', 'b', 'c', 'd'])).toEqual({ a: 100000, b: 100000, c: 100000, d: 100000 })
  })
  it('distributes leftover paise deterministically and keeps the exact total', () => {
    const out = splitEqual(1000, ['a', 'b', 'c']) // 333.33 +1 paisa
    expect(out).toEqual({ a: 334, b: 333, c: 333 })
    expect(sum(Object.values(out))).toBe(1000)
  })
  it('always sums to the amount for many sizes', () => {
    for (let amount = 1; amount < 400; amount += 7) {
      for (let n = 1; n <= 9; n++) {
        const ids = Array.from({ length: n }, (_, i) => `m${i}`)
        expect(sum(Object.values(splitEqual(amount, ids)))).toBe(amount)
      }
    }
  })
  it('handles zero participants', () => {
    expect(splitEqual(100, [])).toEqual({})
  })
})

describe('trip stats - spec example', () => {
  it('matches the worked example from the brief', () => {
    const { trip, ids, add } = setup()
    add('Hotel', 6000, ids.m)
    add('Fuel', 2000, ids.n)
    add('Food', 4000, ids.u)
    const s = computeTripStats(trip)
    expect(s.total).toBe(R(12000))
    expect(s.equalShare).toBe(R(3000))
    expect(s.equalShareMeaningful).toBe(true)
    expect(s.byId[ids.m]).toMatchObject({ paid: R(6000), allocated: R(3000), balance: R(3000) })
    expect(s.byId[ids.n].balance).toBe(-R(1000))
    expect(s.byId[ids.u].balance).toBe(R(1000))
    expect(s.byId[ids.r]).toMatchObject({ paid: 0, balance: -R(3000) })
    expect(s.balanceSum).toBe(0)
    expect(s.settlements).toEqual([
      { from: ids.r, to: ids.m, amount: R(3000) },
      { from: ids.n, to: ids.u, amount: R(1000) },
    ])
  })
})

describe('trip stats - mixed participants', () => {
  it('settlement uses actual allocations, not an overall equal share', () => {
    const { trip, ids, add } = setup()
    add('Taxi', 1000, ids.m, [ids.m, ids.n]) // only 2 of 4
    add('Dinner', 2000, ids.n) // all
    add('Tickets', 1000, ids.m) // same payer again
    const s = computeTripStats(trip)
    expect(s.total).toBe(R(4000))
    expect(s.equalShare).toBe(R(1000)) // informational only
    expect(s.byId[ids.m].paid).toBe(R(2000))
    expect(s.byId[ids.m].allocated).toBe(R(500) + R(500) + R(250))
    expect(s.byId[ids.u].allocated).toBe(R(500) + R(250))
    expect(s.byId[ids.m].balance).toBe(R(2000) - R(1250))
    expect(s.byId[ids.n].balance).toBe(R(2000) - R(1250))
    expect(s.byId[ids.u].balance).toBe(-R(750))
    expect(s.byId[ids.r].balance).toBe(-R(750))
    expect(s.balanceSum).toBe(0)
  })

  it('brief example: Muhsin pays 900 for Niyas and Rafi only', () => {
    const trip = createTrip({ name: 'T', memberNames: ['Muhsin', 'Niyas', 'Rafi'] })
    const [m, n, r] = trip.members.map((x) => x.id)
    trip.expenses.push(createExpense(trip, { title: 'Gift', amount: R(900), payerId: m, participantIds: [n, r] }))
    const s = computeTripStats(trip)
    expect(s.byId[m]).toMatchObject({ paid: R(900), allocated: 0, balance: R(900) })
    expect(s.byId[n].balance).toBe(-R(450))
    expect(s.byId[r].balance).toBe(-R(450))
    expect(s.balanceSum).toBe(0)
  })

  it('payer may be excluded from participants', () => {
    const { trip, ids, add } = setup()
    add('Gift', 300, ids.m, [ids.n, ids.u, ids.r])
    const e = trip.expenses[0]
    expect(e.allocations[ids.m]).toBeUndefined()
    expect(sum(Object.values(e.allocations))).toBe(R(300))
  })
})

describe('uneven paise', () => {
  it('keeps balances summing to exactly zero', () => {
    const { trip, ids, add } = setup()
    trip.expenses.push(
      createExpense(trip, { title: 'Odd', amount: 1000, payerId: ids.m, participantIds: [ids.m, ids.n, ids.u] }),
    )
    trip.expenses.push(createExpense(trip, { title: 'One paisa', amount: 1, payerId: ids.n, participantIds: Object.values(ids) }))
    const s = computeTripStats(trip)
    expect(s.balanceSum).toBe(0)
    const settled = sum(s.settlements.map((t) => t.amount))
    const owed = sum(s.rows.filter((r) => r.balance < 0).map((r) => -r.balance))
    expect(settled).toBe(owed)
    expect(sum(trip.expenses.map((e) => sum(Object.values(e.allocations))))).toBe(s.total)
  })
  it('total not divisible by member count', () => {
    const { trip, ids } = setup()
    trip.expenses.push(createExpense(trip, { title: 'X', amount: 1001, payerId: ids.m, participantIds: Object.values(ids) }))
    const s = computeTripStats(trip)
    expect(s.rows.map((r) => r.allocated)).toEqual([251, 250, 250, 250])
    expect(s.balanceSum).toBe(0)
  })
})

describe('edit and delete recalculate everything', () => {
  it('edit updates totals, shares and settlement', () => {
    const { trip, ids, add } = setup()
    add('Hotel', 4000, ids.m)
    expect(computeTripStats(trip).byId[ids.r].balance).toBe(-R(1000))
    trip.expenses[0] = editExpense(trip, trip.expenses[0], {
      title: 'Hotel',
      amount: R(8000),
      payerId: ids.n,
      participantIds: [ids.m, ids.n],
    })
    const s = computeTripStats(trip)
    expect(s.total).toBe(R(8000))
    expect(s.byId[ids.n].paid).toBe(R(8000))
    expect(s.byId[ids.m].paid).toBe(0)
    expect(s.byId[ids.m].allocated).toBe(R(4000))
    expect(s.byId[ids.r].balance).toBe(0) // no longer a participant, owes nothing
    expect(s.byId[ids.m].balance).toBe(-R(4000))
    expect(s.balanceSum).toBe(0)
    expect(trip.expenses[0].createdAt).toBeLessThanOrEqual(trip.expenses[0].updatedAt)
  })
  it('delete updates everything', () => {
    const { trip, ids, add } = setup()
    add('A', 4000, ids.m)
    add('B', 400, ids.n)
    trip.expenses = trip.expenses.filter((e) => e.title !== 'A')
    const s = computeTripStats(trip)
    expect(s.total).toBe(R(400))
    expect(s.byId[ids.m].paid).toBe(0)
    expect(s.settlements.every((t) => t.to === ids.n)).toBe(true)
  })
  it('no expenses means everyone settled', () => {
    const { trip } = setup()
    const s = computeTripStats(trip)
    expect(s.total).toBe(0)
    expect(s.settlements).toEqual([])
  })
})

describe('allocateExpense', () => {
  it('uses member order regardless of selection order', () => {
    const { trip, ids } = setup()
    const out = allocateExpense(101, [ids.u, ids.m], trip.members)
    expect(out).toEqual({ [ids.m]: 51, [ids.u]: 50 })
  })
})

describe('breakdown', () => {
  it('groups by title ignoring case and sums to 100%', () => {
    const { trip, ids, add } = setup()
    add('Food', 100, ids.m)
    add('food ', 100, ids.n)
    add('Hotel', 200, ids.m)
    const b = computeBreakdown(trip.expenses)
    expect(b).toHaveLength(2)
    expect(sum(b.map((x) => x.pct))).toBeCloseTo(100)
  })
})

describe('settlement algorithm', () => {
  it('settles arbitrary balances exactly', () => {
    const balances = { a: 700, b: -300, c: -250, d: -150, e: 0, f: 900, g: -900 }
    const t = computeSettlements(balances)
    const after = { ...balances }
    t.forEach(({ from, to, amount }) => {
      expect(amount).toBeGreaterThan(0)
      after[from] += amount
      after[to] -= amount
    })
    expect(Object.values(after).every((v) => v === 0)).toBe(true)
    expect(t.length).toBeLessThanOrEqual(5)
  })
  it('returns nothing when all settled', () => {
    expect(computeSettlements({ a: 0, b: 0 })).toEqual([])
  })
  it('is deterministic', () => {
    const b = { a: 100, b: 100, c: -100, d: -100 }
    expect(computeSettlements(b)).toEqual(computeSettlements({ ...b }))
  })
})
