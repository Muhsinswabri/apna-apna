// Page layout for the exported settlement document. Pure: it only needs a text-measuring
// function, so the single-page / multi-page decision can be tested without a browser.
// All sizes are in "page units" (1 unit = 1 CSS px at scale 1); the renderer multiplies by a scale.

export const PAGE_W = 620
export const PAGE_H = 877 // A4 portrait ratio (620 x 877 ~ 210 x 297)
export const MARGIN = 28
export const CONTENT_W = PAGE_W - MARGIN * 2
export const FOOTER_H = 40
export const MIN_IMAGE_H = 800 // a short summary still gets a comfortable portrait image
export const MAX_IMAGE_H = 1480 // tallest single image: a tall phone-portrait shape, still readable when shared

const GAP = 10

/** Wrap text to `maxWidth`; breaks long words by character and ends with "…" past `maxLines`. */
export function wrapText(text, maxWidth, maxLines, weight, size, measure) {
  const fits = (s) => measure(s, weight, size) <= maxWidth
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  const push = (s) => lines.push(s)
  for (const word of words.length ? words : ['']) {
    const tryLine = cur ? `${cur} ${word}` : word
    if (fits(tryLine)) {
      cur = tryLine
      continue
    }
    if (cur) push(cur)
    cur = ''
    let rest = word
    while (rest && !fits(rest)) {
      let n = rest.length
      while (n > 1 && !fits(rest.slice(0, n))) n--
      push(rest.slice(0, n))
      rest = rest.slice(n)
    }
    cur = rest
  }
  if (cur || !lines.length) push(cur)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last.length > 1 && !fits(`${last}…`)) last = last.slice(0, -1)
  kept[maxLines - 1] = `${last.trimEnd()}…`
  return kept
}

function fitSize(text, maxWidth, weight, start, min, measure) {
  let size = start
  while (size > min && measure(text, weight, size) > maxWidth) size -= 1
  return size
}

function heroBlock(r, measure) {
  const pad = 18
  const inner = CONTENT_W - pad * 2
  const thumb = 56
  const textW = inner - thumb - 14
  const titleLines = wrapText(r.tripName, textW, 2, 800, 24, measure)
  const metaLines = [
    ...wrapText(r.period, textW, 1, 600, 13, measure),
    ...wrapText(`${r.currencyName} (${r.currencyCode})`, textW, 2, 600, 13, measure),
  ].filter((l) => l)
  const headH = Math.max(thumb, titleLines.length * 29 + 6 + metaLines.length * 18)
  const totalSize = fitSize(r.total, inner, 800, 36, 20, measure)
  const totalLH = Math.round(totalSize * 1.2)
  const tileH = 56
  const h = 56 + pad + headH + 16 + 16 + 4 + totalLH + 14 + tileH + pad
  return { kind: 'hero', h, gapAfter: 22, pad, thumb, titleLines, metaLines, headH, totalSize, totalLH, tileH }
}

function headingBlock(text, right) {
  return { kind: 'heading', h: 26, gapAfter: 8, text, right, keepNext: true }
}

function memberBlock(m, measure) {
  const pad = 12
  const avatar = 38
  const badgeW = Math.ceil(measure(m.status.label, 700, 11)) + 22
  const nameW = CONTENT_W - pad * 2 - avatar - 12 - badgeW - 10
  const nameLines = wrapText(m.name, nameW, 2, 700, 15, measure)
  const sub = m.active ? '' : 'Left the trip'
  const topH = Math.max(avatar, nameLines.length * 19 + (sub ? 15 : 0))
  const colW = (CONTENT_W - pad * 2 - 24) / 3
  const values = [m.paid, m.allocated, m.balance]
  const horizontal = values.every((v) => measure(v, 800, 14) <= colW - 4)
  const rowSize = Math.min(...values.map((v) => fitSize(v, CONTENT_W - pad * 2 - 24 - 120, 800, 14, 11, measure)))
  const statsH = horizontal ? 52 : 24 * 3 + 24
  const h = pad + topH + 10 + statsH + pad
  return { kind: 'member', h, gapAfter: GAP, pad, avatar, badgeW, nameLines, sub, topH, colW, horizontal, rowSize, statsH, m }
}

function txnBlock(t, measure) {
  const pad = 10
  const avatar = 36
  const side = 118
  const midW = CONTENT_W - pad * 2 - side * 2
  const fromLines = wrapText(t.from.name, side - 8, 2, 700, 12, measure)
  const toLines = wrapText(t.to.name, side - 8, 2, 700, 12, measure)
  const lines = Math.max(fromLines.length, toLines.length)
  const amountSize = fitSize(t.amount, midW - 16, 800, 20, 13, measure)
  const h = pad + avatar + 6 + lines * 15 + pad
  return { kind: 'txn', h, gapAfter: GAP, pad, avatar, side, midW, fromLines, toLines, amountSize, t }
}

function noteBlock(text, measure, gapAfter = 16) {
  const lines = wrapText(text, CONTENT_W - 4, 6, 500, 11.5, measure)
  return { kind: 'note', h: lines.length * 16, gapAfter, lines }
}

function calloutBlock(text, tone, measure) {
  const lines = wrapText(text, CONTENT_W - 40, 3, 700, 14, measure)
  return { kind: 'callout', h: 32 + lines.length * 20, gapAfter: 16, lines, tone }
}

/** All blocks of the document, in reading order. Every member and every payment is one block. */
export function buildBlocks(r, measure) {
  const blocks = [heroBlock(r, measure)]
  blocks.push(headingBlock('Member balances', `${r.memberCount} ${r.memberCount === 1 ? 'member' : 'members'}`))
  r.members.forEach((m) => blocks.push(memberBlock(m, measure)))
  blocks.push(
    noteBlock(
      'Balance = total paid − expense share. Only the people selected for an expense share its cost; members who joined later or left earlier are counted only for the expenses they were part of.',
      measure,
    ),
  )
  blocks.push(headingBlock('Who pays whom', `${r.transactions.length} ${r.transactions.length === 1 ? 'payment' : 'payments'}`))
  if (r.expenseCount === 0) blocks.push(calloutBlock('No expenses recorded yet, so nobody owes anything.', 'plain', measure))
  else if (!r.transactions.length) blocks.push(calloutBlock('Everyone is settled. Nobody owes anybody.', 'good', measure))
  else r.transactions.forEach((t) => blocks.push(txnBlock(t, measure)))
  if (r.transactions.length) {
    blocks.push(noteBlock('A practical plan that settles everyone with a small number of payments, not always the absolute minimum.', measure, 0))
  }
  return blocks
}

function contHeader(r, measure) {
  const right = wrapText(`${r.tripName} · ${r.title}`, CONTENT_W - 150, 1, 700, 12, measure)[0]
  return { kind: 'cont', h: 34, gapAfter: 16, right }
}

/**
 * Decide the format and place every block.
 *  - Everything fits one portrait image at full size -> 'png', one page sized to its content.
 *  - Otherwise -> 'pdf', fixed A4-ratio pages; a block is never split, a heading stays with
 *    the block after it, and pages after the first repeat a compact header.
 */
export function layoutReport(r, measure) {
  const blocks = buildBlocks(r, measure)
  const stackH = blocks.reduce((s, b, i) => s + b.h + (i < blocks.length - 1 ? b.gapAfter : 0), 0)
  const neededH = Math.ceil(MARGIN + stackH + 20 + FOOTER_H + MARGIN)

  if (neededH <= MAX_IMAGE_H) {
    let y = MARGIN
    const items = blocks.map((b) => {
      const placed = { ...b, y }
      y += b.h + b.gapAfter
      return placed
    })
    return { format: 'png', width: PAGE_W, pages: [{ number: 1, total: 1, height: Math.max(MIN_IMAGE_H, neededH), items }] }
  }

  const head = contHeader(r, measure)
  const bottom = PAGE_H - MARGIN - FOOTER_H
  const pages = []
  let page = null
  let y = 0
  const start = (first) => {
    page = { number: pages.length + 1, total: 0, height: PAGE_H, items: [] }
    pages.push(page)
    y = MARGIN
    if (!first) {
      page.items.push({ ...head, y })
      y += head.h + head.gapAfter
    }
  }
  start(true)
  blocks.forEach((b, i) => {
    let need = b.h
    if (b.keepNext && blocks[i + 1]) need += b.gapAfter + blocks[i + 1].h
    const hasContent = page.items.some((it) => it.kind !== 'cont')
    if (y + need > bottom && hasContent) start(false)
    page.items.push({ ...b, y })
    y += b.h + b.gapAfter
  })
  pages.forEach((p) => (p.total = pages.length))
  return { format: 'pdf', width: PAGE_W, pages }
}
