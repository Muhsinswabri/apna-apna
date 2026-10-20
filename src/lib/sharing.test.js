import { describe, expect, it } from 'vitest'
import { computeTripStats } from './calculations.js'
import { formatMoney } from './currency.js'
import { createExpense, createTrip } from './model.js'
import { buildPdf } from './pdf.js'
import { CONTENT_W, MARGIN, PAGE_H, MAX_IMAGE_H, layoutReport, wrapText } from './reportLayout.js'
import { balanceStatus, buildSettlementReport, fileNameFor, tripPeriod } from './settlementReport.js'
import { canShareFile, shareFile } from './shareFile.js'

// Stand-in for canvas text measuring: width grows with length and font size.
const measure = (text, _weight, size) => String(text).length * size * 0.55

function makeTrip(n, { code = 'INR', name = 'Wayanad Trip', expenses = n * 2 } = {}) {
  const names = Array.from({ length: n }, (_, i) => `Member ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? i : ''}`)
  const trip = createTrip({ name, currencyCode: code, memberNames: names })
  const ids = trip.members.map((m) => m.id)
  for (let i = 0; i < expenses; i++) {
    trip.expenses.push(
      createExpense(trip, {
        title: `Item ${i}`,
        amount: 100 + i * 37,
        payerId: ids[i % ids.length],
        participantIds: ids.filter((_, k) => (i + k) % 3 !== 0),
      }),
    )
  }
  return trip
}

const reportFor = (trip, now = Date.UTC(2026, 9, 20)) => buildSettlementReport(trip, computeTripStats(trip), now)

describe('settlement report data', () => {
  it('uses the saved trip and its currency, with no invented values', () => {
    const trip = makeTrip(3, { code: 'AED' })
    const stats = computeTripStats(trip)
    const r = reportFor(trip)
    expect(r.tripName).toBe('Wayanad Trip')
    expect(r.currencyCode).toBe('AED')
    expect(r.currencyName).toMatch(/dirham/i)
    expect(r.expenseCount).toBe(trip.expenses.length)
    expect(r.memberCount).toBe(3)
    expect(r.members.map((m) => m.name)).toEqual(stats.rows.map((x) => x.name))
    expect(r.total).toBe(formatMoney(stats.total, 'AED'))
    expect(r.transactions).toHaveLength(stats.settlements.length)
  })

  it('labels balances To Receive, To Pay or Settled', () => {
    expect(balanceStatus(500).label).toBe('To Receive')
    expect(balanceStatus(-1).label).toBe('To Pay')
    expect(balanceStatus(0).label).toBe('Settled')
  })

  it('keeps balances equal to the on-screen calculation', () => {
    const trip = makeTrip(4)
    const stats = computeTripStats(trip)
    const r = reportFor(trip)
    r.members.forEach((m, i) => expect(m.balanceMinor).toBe(stats.rows[i].balance))
    expect(r.members.filter((m) => m.status.key === 'receive').length).toBe(stats.rows.filter((x) => x.balance > 0).length)
  })

  it('names the file after the trip and format', () => {
    const r = reportFor(makeTrip(2, { name: 'Wayanad Trip' }))
    expect(fileNameFor(r, 'png')).toBe('ApnaApna-Wayanad-Trip-Settlement.png')
    expect(fileNameFor(r, 'pdf')).toBe('ApnaApna-Wayanad-Trip-Settlement.pdf')
  })

  it('shows the title by trip state and a period from saved dates', () => {
    const trip = makeTrip(2)
    expect(reportFor(trip).title).toBe('Current Status')
    const done = { ...trip, status: 'completed', completedAt: trip.createdAt + 3 * 86400000 }
    expect(reportFor(done).title).toBe('Final Settlement')
    expect(tripPeriod(done)).toContain('–')
  })

  it('reflects the latest data when an expense is added', () => {
    const trip = makeTrip(3)
    const before = reportFor(trip)
    const ids = trip.members.map((m) => m.id)
    const next = { ...trip, expenses: [...trip.expenses, createExpense(trip, { title: 'Late', amount: 9999, payerId: ids[0], participantIds: ids })] }
    const after = reportFor(next)
    expect(after.expenseCount).toBe(before.expenseCount + 1)
    expect(after.total).not.toBe(before.total)
  })
})

describe('layout and format choice', () => {
  const countKinds = (layout, kind) => layout.pages.flatMap((p) => p.items).filter((i) => i.kind === kind)

  it('puts a short settlement on one image', () => {
    const layout = layoutReport(reportFor(makeTrip(3)), measure)
    expect(layout.format).toBe('png')
    expect(layout.pages).toHaveLength(1)
    expect(layout.pages[0].height).toBeLessThanOrEqual(MAX_IMAGE_H)
  })

  it('switches to a multi-page PDF when the content cannot fit', () => {
    const layout = layoutReport(reportFor(makeTrip(14)), measure)
    expect(layout.format).toBe('pdf')
    expect(layout.pages.length).toBeGreaterThan(1)
    layout.pages.forEach((p) => expect(p.total).toBe(layout.pages.length))
  })

  it('decides by content, not only by member count', () => {
    const few = layoutReport(reportFor(makeTrip(3)), measure)
    const many = layoutReport(reportFor(makeTrip(10)), measure)
    expect(few.format).toBe('png')
    expect(many.format).toBe('pdf')
    // The same number of members can still pick differently when a name needs more lines.
    const longNames = reportFor(makeTrip(5))
    longNames.members.forEach((m) => (m.name = 'A very long member name that needs several lines to be shown in full '.repeat(3)))
    const l = layoutReport(longNames, measure)
    expect(l.pages.flatMap((p) => p.items).filter((i) => i.kind === 'member')).toHaveLength(5)
  })

  it('includes every member and every payment exactly once', () => {
    const r = reportFor(makeTrip(14))
    const layout = layoutReport(r, measure)
    expect(countKinds(layout, 'member').map((i) => i.m.name)).toEqual(r.members.map((m) => m.name))
    expect(countKinds(layout, 'txn').map((i) => i.t.text)).toEqual(r.transactions.map((t) => t.text))
  })

  it('never splits a block, repeats the header and keeps headings with their content', () => {
    const layout = layoutReport(reportFor(makeTrip(14)), measure)
    const bottom = PAGE_H - MARGIN - 40
    layout.pages.forEach((p, i) => {
      p.items.forEach((it) => expect(it.y + it.h).toBeLessThanOrEqual(bottom + 0.001))
      if (i > 0) expect(p.items[0].kind).toBe('cont')
      const last = p.items[p.items.length - 1]
      expect(last.kind).not.toBe('heading')
    })
  })

  it('handles long names and huge amounts without overflowing the card', () => {
    const r = reportFor(makeTrip(3))
    r.members[0].name = 'Extraordinarily-long-name-without-any-spaces-to-break-on-at-all'
    r.members[0].paid = '₹99,99,99,99,99,99,999.00'
    const layout = layoutReport(r, measure)
    const m = layout.pages[0].items.find((i) => i.kind === 'member')
    expect(m.nameLines.length).toBeLessThanOrEqual(2)
    m.nameLines.forEach((l) => expect(measure(l, 700, 15)).toBeLessThanOrEqual(CONTENT_W))
    expect(m.horizontal).toBe(false) // stacks the figures instead of shrinking or clipping them
  })

  it('wraps and truncates text safely', () => {
    expect(wrapText('one two three', 1000, 2, 600, 13, measure)).toEqual(['one two three'])
    const lines = wrapText('word '.repeat(60), 120, 2, 600, 13, measure)
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
    expect(wrapText('', 100, 2, 600, 13, measure)).toEqual([''])
  })

  it('says so when nothing was spent or everyone is settled', () => {
    const empty = layoutReport(reportFor(makeTrip(2, { expenses: 0 })), measure)
    expect(countKinds(empty, 'callout')).toHaveLength(1)
    expect(countKinds(empty, 'txn')).toHaveLength(0)
  })
})

describe('pdf writer', () => {
  it('writes a well-formed multi-page file', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    const bytes = buildPdf([{ jpeg, width: 10, height: 14 }, { jpeg, width: 10, height: 14 }], { title: 'Trip (test)' })
    const s = new TextDecoder('latin1').decode(bytes)
    expect(s.startsWith('%PDF-1.4')).toBe(true)
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(s).toContain('/Count 2')
    expect(s.match(/\/Type \/Page /g)).toHaveLength(2)
    // the xref offset points at the xref table
    const at = Number(s.match(/startxref\n(\d+)/)[1])
    expect(s.slice(at, at + 4)).toBe('xref')
    expect(() => buildPdf([])).toThrow()
  })
})

describe('native sharing', () => {
  const file = { name: 'a.png' }
  const nav = (over = {}) => ({ canShare: () => true, share: async () => {}, ...over })
  const err = (name) => Object.assign(new Error(name), { name })

  it('detects file sharing support', () => {
    expect(canShareFile(file, nav())).toBe(true)
    expect(canShareFile(file, nav({ canShare: () => false }))).toBe(false)
    expect(canShareFile(file, { share: async () => {} })).toBe(false)
    expect(canShareFile(file, undefined)).toBe(false)
    expect(canShareFile(file, nav({ canShare: () => { throw new Error('x') } }))).toBe(false)
  })

  it('reports each outcome honestly', async () => {
    expect(await shareFile(file, 't', nav())).toBe('shared')
    expect(await shareFile(file, 't', nav({ share: async () => { throw err('AbortError') } }))).toBe('cancelled')
    expect(await shareFile(file, 't', nav({ share: async () => { throw err('NotAllowedError') } }))).toBe('needs-tap')
    expect(await shareFile(file, 't', nav({ share: async () => { throw err('DataError') } }))).toBe('failed')
    expect(await shareFile(file, 't', {})).toBe('unsupported')
  })

  it('passes the file to the share sheet', async () => {
    let seen
    await shareFile(file, 'Title', nav({ share: async (d) => { seen = d } }))
    expect(seen.files).toEqual([file])
    expect(seen.title).toBe('Title')
  })
})
