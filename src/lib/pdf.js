// A small PDF writer for pages that are already rendered as JPEG images. It needs no library
// and no network, and it produces a standard PDF 1.4 file any viewer or printer can open.

const A4_W = 595.28
const A4_H = 841.89

const enc = new TextEncoder()

/**
 * @param {{ jpeg: Uint8Array, width: number, height: number }[]} pages  JPEG bytes and pixel size
 * @param {{ pageWidth?: number, pageHeight?: number, title?: string }} [opts]  sizes in points
 * @returns {Uint8Array}
 */
export function buildPdf(pages, { pageWidth = A4_W, pageHeight = A4_H, title = '' } = {}) {
  if (!pages.length) throw new Error('A PDF needs at least one page')
  const chunks = []
  const offsets = []
  let length = 0
  const write = (data) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (n, body) => {
    offsets[n] = length
    write(`${n} 0 obj\n`)
    write(body)
    write('\nendobj\n')
  }

  // Object numbers: 1 catalog, 2 pages, 3 info, then 3 objects per page (page, image, content).
  const pageObj = (i) => 4 + i * 3
  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`)
  const safeTitle = title.replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, '')
  object(3, `<< /Title (${safeTitle}) /Producer (Apna Apna) >>`)

  pages.forEach((p, i) => {
    const page = pageObj(i)
    const w = pageWidth.toFixed(2)
    const h = pageHeight.toFixed(2)
    object(
      page,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${page + 1} 0 R >> >> /Contents ${page + 2} 0 R >>`,
    )
    offsets[page + 1] = length
    write(
      `${page + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
    )
    write(p.jpeg)
    write('\nendstream\nendobj\n')
    const draw = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`
    object(page + 2, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`)
  })

  const count = 4 + pages.length * 3
  const xref = length
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`
  for (let n = 1; n < count; n++) table += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`
  write(table)
  write(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`)

  const out = new Uint8Array(length)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}
