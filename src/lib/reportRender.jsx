import { renderToStaticMarkup } from 'react-dom/server'
import { Art } from '../components/MemberAvatar.jsx'
import { TripScene } from '../components/TripThumbnail.jsx'
import { getMemberAvatar } from './avatars.js'
import { buildPdf } from './pdf.js'
import { CONTENT_W, FOOTER_H, MARGIN, PAGE_W, layoutReport } from './reportLayout.js'
import { fileNameFor } from './settlementReport.js'
import { getTripImageAsset } from './tripImages.js'

// Browser-only: draws the settlement document straight onto a canvas. No part of the app screen is
// captured, nothing is fetched from a server, and everything it needs is bundled with the app.

const FAMILY = '"Manrope Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const font = (weight, size) => `${weight} ${size}px ${FAMILY}`

// The report always uses the light palette, whatever theme the app is in.
const C = {
  navy: '#171A35',
  ink: '#202033',
  mute: '#6A6C86',
  deep: '#5B49BD',
  purple: '#7563D8',
  lav: '#E6DFFF',
  lavSoft: '#F3F0FF',
  mint: '#D9F8CB',
  mintSoft: '#EBFBE4',
  sunken: '#EEF0F6',
  line: '#E2E4ED',
  pos: '#208A60',
  neg: '#D95364',
  negSoft: '#FDECEE',
}
const TONES = ['#DDE8FF', '#E6DEFF', '#E8F5B8', '#FFE3D6', '#D9F1E8', '#FFDDE6']
const TONE_INK = ['#1E4EBE', '#5B3CC4', '#4A5F0A', '#B04E1E', '#17745A', '#B03A62']

const PNG_SCALE = 3
const PDF_SCALE = 2

let measureCtx = null
export function measure(text, weight, size) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  measureCtx.font = font(weight, size)
  return measureCtx.measureText(text).width
}

function reportStrings(r) {
  const out = [r.tripName, r.period, r.currencyName, r.currencyCode, r.total, r.generatedOn, r.title, 'Apna Apna 0123456789']
  r.members.forEach((m) => out.push(m.name, m.paid, m.allocated, m.balance, m.status.label))
  r.transactions.forEach((t) => out.push(t.from.name, t.to.name, t.amount))
  return out.join(' ')
}

async function loadFonts(r) {
  const text = reportStrings(r)
  await Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(font(w, 16), text)))
  await document.fonts.ready
}

async function toImage(src) {
  const img = new Image()
  img.src = src
  await img.decode()
  return img
}

function svgToImage(node, size) {
  const markup = renderToStaticMarkup(node).replace(
    '<svg ',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `,
  )
  return toImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`)
}

async function loadAssets(r) {
  const assets = { logo: null, thumb: null, avatars: new Map() }
  const jobs = []
  jobs.push(
    toImage(`${import.meta.env.BASE_URL}icons/icon-192.png`).then(
      (i) => (assets.logo = i),
      () => null,
    ),
  )
  const scene = getTripImageAsset({ name: r.tripName, imageCategory: r.imageCategory }).id
  jobs.push(svgToImage(<TripScene id={scene} />, 56).then((i) => (assets.thumb = i), () => null))
  const people = [...r.members, ...r.transactions.flatMap((t) => [t.from, t.to])]
  for (const p of people) {
    const art = getMemberAvatar(p)
    if (!art || assets.avatars.has(art.id)) continue
    assets.avatars.set(art.id, null)
    jobs.push(svgToImage(<Art a={art} />, 64).then((i) => assets.avatars.set(art.id, i), () => null))
  }
  await Promise.all(jobs)
  return assets
}

// ---- drawing helpers -------------------------------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + k, y)
  ctx.arcTo(x + w, y, x + w, y + h, k)
  ctx.arcTo(x + w, y + h, x, y + h, k)
  ctx.arcTo(x, y + h, x, y, k)
  ctx.arcTo(x, y, x + w, y, k)
  ctx.closePath()
}

function text(ctx, str, x, y, { weight = 600, size = 13, color = C.navy, align = 'left' } = {}) {
  ctx.font = font(weight, size)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(str, x, y)
}

function card(ctx, x, y, w, h, r = 20) {
  ctx.save()
  ctx.shadowColor = 'rgba(23, 26, 53, 0.10)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2
  rr(ctx, x, y, w, h, r)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r)
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1
  ctx.stroke()
}

function pill(ctx, label, rightX, y, fill, color) {
  const w = measure(label, 700, 11) + 22
  rr(ctx, rightX - w, y, w, 24, 12)
  ctx.fillStyle = fill
  ctx.fill()
  text(ctx, label, rightX - w / 2, y + 12.5, { weight: 700, size: 11, color, align: 'center' })
}

function drawAvatar(ctx, person, assets, x, y, size) {
  const art = getMemberAvatar(person)
  const img = art && assets.avatars.get(art.id)
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  if (img) {
    ctx.drawImage(img, x, y, size, size)
  } else {
    let tone = 0
    for (const ch of String(person.id ?? person.name ?? '')) tone = (tone + ch.charCodeAt(0)) % 6
    ctx.fillStyle = TONES[tone]
    ctx.fillRect(x, y, size, size)
    text(ctx, (String(person.name ?? '?').trim()[0] ?? '?').toUpperCase(), x + size / 2, y + size / 2 + 1, {
      weight: 800,
      size: size * 0.4,
      color: TONE_INK[tone],
      align: 'center',
    })
  }
  ctx.restore()
}

function drawLogo(ctx, assets, x, y, size) {
  if (!assets.logo) {
    rr(ctx, x, y, size, size, size * 0.22)
    ctx.fillStyle = C.navy
    ctx.fill()
    return
  }
  ctx.save()
  rr(ctx, x, y, size, size, size * 0.22)
  ctx.clip()
  ctx.drawImage(assets.logo, x, y, size, size)
  ctx.restore()
}

function balanceColor(key) {
  return key === 'receive' ? C.pos : key === 'pay' ? C.neg : C.mute
}

// ---- blocks ----------------------------------------------------------------------------------

function drawHero(ctx, b, r, assets) {
  drawLogo(ctx, assets, 0, 0, 40)
  text(ctx, 'Apna Apna', 50, 14, { weight: 800, size: 20 })
  text(ctx, 'Every Trip. Every Expense. Sorted.', 50, 32, { weight: 600, size: 10.5, color: C.mute })
  const tw = measure(r.title, 700, 12) + 26
  rr(ctx, CONTENT_W - tw, 7, tw, 26, 13)
  ctx.fillStyle = r.completed ? C.mint : C.lav
  ctx.fill()
  text(ctx, r.title, CONTENT_W - tw / 2, 20.5, { weight: 700, size: 12, color: r.completed ? C.pos : C.deep, align: 'center' })

  const top = 56
  const cardH = b.h - top
  ctx.save()
  rr(ctx, 0, top, CONTENT_W, cardH, 24)
  ctx.clip()
  const g = ctx.createLinearGradient(0, top, CONTENT_W, top + cardH)
  g.addColorStop(0, C.lav)
  g.addColorStop(1, C.lavSoft)
  ctx.fillStyle = g
  ctx.fillRect(0, top, CONTENT_W, cardH)
  // Soft travel touches: a mint hill and a dotted flight path with a small plane.
  ctx.fillStyle = 'rgba(217, 248, 203, 0.75)'
  ctx.beginPath()
  ctx.arc(CONTENT_W - 40, top + cardH + 24, 96, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(CONTENT_W - 150, top + cardH + 44, 70, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(91, 73, 189, 0.35)'
  ctx.lineWidth = 1.6
  ctx.setLineDash([2, 5])
  ctx.lineCap = 'round'
  const py = top + b.pad + b.headH + 30
  ctx.beginPath()
  ctx.moveTo(CONTENT_W - 190, py + 26)
  ctx.quadraticCurveTo(CONTENT_W - 120, py - 14, CONTENT_W - 44, py + 6)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C.deep
  ctx.beginPath()
  ctx.moveTo(CONTENT_W - 44, py + 6)
  ctx.lineTo(CONTENT_W - 56, py - 2)
  ctx.lineTo(CONTENT_W - 53, py + 8)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  const pad = b.pad
  const inner = CONTENT_W - pad * 2
  if (assets.thumb) {
    ctx.save()
    rr(ctx, CONTENT_W - pad - b.thumb, top + pad, b.thumb, b.thumb, 18)
    ctx.clip()
    ctx.drawImage(assets.thumb, CONTENT_W - pad - b.thumb, top + pad, b.thumb, b.thumb)
    ctx.restore()
  }
  let y = top + pad
  b.titleLines.forEach((l, i) => text(ctx, l, pad, y + 14.5 + i * 29, { weight: 800, size: 24 }))
  y += b.titleLines.length * 29 + 6
  b.metaLines.forEach((l, i) => text(ctx, l, pad, y + 9 + i * 18, { weight: 600, size: 13, color: '#4F5272' }))

  y = top + pad + b.headH + 16
  text(ctx, 'Total trip expenses', pad, y + 8, { weight: 700, size: 12, color: '#4F5272' })
  y += 20
  text(ctx, r.total, pad, y + b.totalLH / 2, { weight: 800, size: b.totalSize })
  y += b.totalLH + 14
  const tileW = (inner - 16) / 3
  const stats = [
    [String(r.expenseCount), 'Expenses'],
    [String(r.memberCount), 'Members'],
    [String(r.paymentCount), 'Payments'],
  ]
  stats.forEach(([value, label], i) => {
    const x = pad + i * (tileW + 8)
    rr(ctx, x, y, tileW, b.tileH, 16)
    ctx.fillStyle = 'rgba(255,255,255,0.78)'
    ctx.fill()
    text(ctx, value, x + 14, y + 22, { weight: 800, size: 20 })
    text(ctx, label, x + 14, y + 42, { weight: 600, size: 11, color: C.mute })
  })
}

function drawCont(ctx, b, r, assets) {
  drawLogo(ctx, assets, 0, 0, 28)
  text(ctx, 'Apna Apna', 38, 14, { weight: 800, size: 15 })
  text(ctx, b.right, CONTENT_W, 14, { weight: 700, size: 12, color: C.mute, align: 'right' })
  ctx.fillStyle = C.line
  ctx.fillRect(0, 31, CONTENT_W, 1)
}

function drawHeading(ctx, b) {
  text(ctx, b.text, 2, 13, { weight: 800, size: 17 })
  text(ctx, b.right, CONTENT_W - 2, 13, { weight: 600, size: 12, color: C.mute, align: 'right' })
}

function drawMember(ctx, b, assets) {
  const { m, pad } = b
  card(ctx, 0, 0, CONTENT_W, b.h)
  drawAvatar(ctx, m, assets, pad, pad + (b.topH - b.avatar) / 2, b.avatar)
  const tone = {
    receive: [C.mintSoft, C.pos],
    pay: [C.negSoft, C.neg],
    settled: [C.sunken, C.mute],
  }[m.status.key]
  pill(ctx, m.status.label, CONTENT_W - pad, pad + (b.topH - 24) / 2, tone[0], tone[1])

  const nameX = pad + b.avatar + 12
  const textH = b.nameLines.length * 19 + (b.sub ? 15 : 0)
  let y = pad + (b.topH - textH) / 2
  b.nameLines.forEach((l, i) => text(ctx, l, nameX, y + 9.5 + i * 19, { weight: 700, size: 15 }))
  y += b.nameLines.length * 19
  if (b.sub) text(ctx, b.sub, nameX, y + 7.5, { weight: 600, size: 11, color: C.mute })

  const boxY = pad + b.topH + 10
  const boxX = pad
  const boxW = CONTENT_W - pad * 2
  rr(ctx, boxX, boxY, boxW, b.statsH, 16)
  ctx.fillStyle = C.sunken
  ctx.fill()
  const cols = [
    ['Total paid', m.paid, C.navy],
    ['Expense share', m.allocated, C.navy],
    ['Balance', m.balance, balanceColor(m.status.key)],
  ]
  if (b.horizontal) {
    cols.forEach(([label, value, color], i) => {
      const x = boxX + 12 + i * b.colW
      text(ctx, label, x, boxY + 17, { weight: 600, size: 11, color: C.mute })
      text(ctx, value, x, boxY + 36, { weight: 800, size: 14, color })
    })
  } else {
    cols.forEach(([label, value, color], i) => {
      const cy = boxY + 12 + i * 24 + 12
      text(ctx, label, boxX + 12, cy, { weight: 600, size: 11, color: C.mute })
      text(ctx, value, boxX + boxW - 12, cy, { weight: 800, size: b.rowSize, color, align: 'right' })
    })
  }
}

function drawTxn(ctx, b, assets) {
  const { t, pad, avatar, side } = b
  card(ctx, 0, 0, CONTENT_W, b.h)
  const sides = [
    [t.from, b.fromLines, pad + side / 2],
    [t.to, b.toLines, CONTENT_W - pad - side / 2],
  ]
  sides.forEach(([person, lines, cx]) => {
    drawAvatar(ctx, person, assets, cx - avatar / 2, pad, avatar)
    lines.forEach((l, i) => text(ctx, l, cx, pad + avatar + 6 + 7.5 + i * 15, { weight: 700, size: 12, align: 'center' }))
  })
  const mid = CONTENT_W / 2
  const cy = pad + avatar / 2
  text(ctx, t.amount, mid, cy - 7, { weight: 800, size: b.amountSize, color: C.neg, align: 'center' })
  const x1 = pad + side + 6
  const x2 = CONTENT_W - pad - side - 6
  ctx.strokeStyle = '#B9BBCF'
  ctx.lineWidth = 1.6
  ctx.lineCap = 'round'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x1, cy + 13)
  ctx.lineTo(x2 - 3, cy + 13)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x2 - 8, cy + 8)
  ctx.lineTo(x2, cy + 13)
  ctx.lineTo(x2 - 8, cy + 18)
  ctx.stroke()
}

function drawNote(ctx, b) {
  b.lines.forEach((l, i) => text(ctx, l, 2, 8 + i * 16, { weight: 500, size: 11.5, color: C.mute }))
}

function drawCallout(ctx, b) {
  const good = b.tone === 'good'
  rr(ctx, 0, 0, CONTENT_W, b.h, 20)
  ctx.fillStyle = good ? C.mintSoft : C.sunken
  ctx.fill()
  b.lines.forEach((l, i) =>
    text(ctx, l, CONTENT_W / 2, 16 + 10 + i * 20, { weight: 700, size: 14, color: good ? C.pos : C.navy, align: 'center' }),
  )
}

function drawBackground(ctx, height) {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, PAGE_W, height)
  // Quiet decoration: a lavender glow at the top and mint hills at the bottom.
  const glow = ctx.createRadialGradient(PAGE_W, 0, 0, PAGE_W, 0, 260)
  glow.addColorStop(0, 'rgba(230, 223, 255, 0.85)')
  glow.addColorStop(1, 'rgba(230, 223, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, PAGE_W, 280)
  ctx.fillStyle = 'rgba(217, 248, 203, 0.5)'
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(0, height - 34)
  ctx.quadraticCurveTo(110, height - 74, 230, height - 30)
  ctx.quadraticCurveTo(360, height - 76, PAGE_W, height - 24)
  ctx.lineTo(PAGE_W, height)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(230, 223, 255, 0.7)'
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(0, height - 14)
  ctx.quadraticCurveTo(160, height - 40, 330, height - 12)
  ctx.quadraticCurveTo(480, height - 36, PAGE_W, height - 10)
  ctx.lineTo(PAGE_W, height)
  ctx.closePath()
  ctx.fill()
}

function drawFooter(ctx, page, r) {
  const y = page.height - MARGIN - FOOTER_H + 8
  ctx.fillStyle = C.line
  ctx.fillRect(MARGIN, y, CONTENT_W, 1)
  text(ctx, `Generated on ${r.generatedOn} with Apna Apna`, MARGIN, y + 16, { weight: 600, size: 11, color: C.mute })
  const right = page.total > 1 ? `Page ${page.number} of ${page.total}` : r.currencyCode
  text(ctx, right, MARGIN + CONTENT_W, y + 16, { weight: 700, size: 11, color: C.deep, align: 'right' })
}

function paintPage(canvas, page, r, assets, scale) {
  const ctx = canvas.getContext('2d')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawBackground(ctx, page.height)
  for (const it of page.items) {
    ctx.save()
    ctx.translate(MARGIN, it.y)
    if (it.kind === 'hero') drawHero(ctx, it, r, assets)
    else if (it.kind === 'cont') drawCont(ctx, it, r, assets)
    else if (it.kind === 'heading') drawHeading(ctx, it)
    else if (it.kind === 'member') drawMember(ctx, it, assets)
    else if (it.kind === 'txn') drawTxn(ctx, it, assets)
    else if (it.kind === 'note') drawNote(ctx, it)
    else if (it.kind === 'callout') drawCallout(ctx, it)
    ctx.restore()
  }
  drawFooter(ctx, page, r)
}

function makeCanvas(page, scale) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(PAGE_W * scale)
  canvas.height = Math.round(page.height * scale)
  return canvas
}

const toBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the file'))), type, quality))

function release(canvas) {
  canvas.width = 0
  canvas.height = 0
}

/**
 * Lay the report out, pick the format from the real content and render it.
 * @returns {{ format: 'png' | 'pdf', blob: Blob, previewBlob: Blob, name: string, pageCount: number }}
 */
export async function renderSettlementFile(report, { onFormat } = {}) {
  await loadFonts(report)
  const assets = await loadAssets(report)
  const layout = layoutReport(report, measure)
  onFormat?.(layout.format)

  if (layout.format === 'png') {
    const page = layout.pages[0]
    const canvas = makeCanvas(page, PNG_SCALE)
    paintPage(canvas, page, report, assets, PNG_SCALE)
    const blob = await toBlob(canvas, 'image/png')
    release(canvas)
    if (blob.size < 3000) throw new Error('The image came out empty')
    return { format: 'png', blob, previewBlob: blob, name: fileNameFor(report, 'png'), pageCount: 1 }
  }

  const pages = []
  let previewBlob = null
  for (const page of layout.pages) {
    const canvas = makeCanvas(page, PDF_SCALE)
    paintPage(canvas, page, report, assets, PDF_SCALE)
    const jpeg = await toBlob(canvas, 'image/jpeg', 0.92)
    pages.push({ jpeg: new Uint8Array(await jpeg.arrayBuffer()), width: canvas.width, height: canvas.height })
    if (!previewBlob) previewBlob = jpeg
    release(canvas)
  }
  if (pages.some((p) => p.jpeg.length < 3000)) throw new Error('A page came out empty')
  const bytes = buildPdf(pages, { title: `${report.tripName} - ${report.title}` })
  const blob = new Blob([bytes], { type: 'application/pdf' })
  return { format: 'pdf', blob, previewBlob, name: fileNameFor(report, 'pdf'), pageCount: pages.length }
}

