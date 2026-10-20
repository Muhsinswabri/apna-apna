// Builds app icons from assets/logo-source.webp. Run: npm run icons
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'assets', 'logo-source.webp')
const out = path.join(root, 'public', 'icons')
await mkdir(out, { recursive: true })

// The rounded square inside the 1254px source artwork (excludes the tagline below it).
const CROP = { left: 176, top: 152, width: 908, height: 908 }

const roundedMask = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.225}" fill="#fff"/></svg>`)

const gradient = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3EEFF"/><stop offset="1" stop-color="#EBE2FF"/></linearGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`)

/** The logo tile with transparent rounded corners. */
async function tile(size) {
  return sharp(src)
    .extract(CROP)
    .resize(size, size)
    .composite([{ input: roundedMask(size), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** Logo tile centred on a full-bleed gradient (for maskable / iOS, which add their own shape). */
async function padded(size, scale) {
  const inner = Math.round(size * scale)
  const off = Math.round((size - inner) / 2)
  return sharp(gradient(size))
    .composite([{ input: await tile(inner), left: off, top: off }])
    .png()
    .toBuffer()
}

const write = async (name, buf) => {
  await sharp(buf).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(path.join(out, name))
  console.log('wrote', name)
}

await write('icon-192.png', await tile(192))
await write('icon-512.png', await tile(512))
await write('icon-maskable-512.png', await padded(512, 0.8))
await write('apple-touch-icon.png', await padded(180, 0.94))
await write('favicon.png', await tile(64))
