import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Download, Loader2, Share2 } from 'lucide-react'
import { computeTripStats } from '../lib/calculations.js'
import { downloadBlob, settlementText } from '../lib/exporters.js'
import { buildSettlementReport } from '../lib/settlementReport.js'
import { canShareFile, shareFile, toFile } from '../lib/shareFile.js'
import { Sheet } from './Sheet.jsx'
import { useToast } from './Toast.jsx'

const LABELS = {
  idle: 'Share Settlement Summary',
  summary: 'Preparing Summary...',
  png: 'Preparing Image...',
  pdf: 'Preparing PDF...',
}

/**
 * "Share Settlement Summary": builds a standalone image (short trips) or PDF (long ones) from the
 * latest saved trip, then opens the native share sheet, or offers Download and Copy text.
 * The renderer is loaded on first use, so it adds nothing to the normal screens.
 */
export function ShareSummary({ trip, className = 'btn-primary col-span-2' }) {
  const toast = useToast()
  const [stage, setStage] = useState('idle') // idle | summary | png | pdf
  const [result, setResult] = useState(null) // { file, format, name, pageCount, canShare }
  const [previewUrl, setPreviewUrl] = useState('')
  const [sharing, setSharing] = useState(false)
  const latest = useRef(trip)
  latest.current = trip
  const busy = useRef(false)

  // Object URLs are released as soon as the preview is replaced or the sheet is gone.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const close = useCallback(() => {
    setResult(null)
    setPreviewUrl('')
  }, [])

  const text = () => {
    const t = latest.current
    return settlementText(t, computeTripStats(t))
  }

  const onGenerate = async () => {
    if (busy.current) return
    busy.current = true
    setStage('summary')
    try {
      const t = latest.current
      const stats = computeTripStats(t)
      const report = buildSettlementReport(t, stats)
      const { renderSettlementFile } = await import('../lib/reportRender.jsx')
      const out = await renderSettlementFile(report, { onFormat: (f) => setStage(f) })
      const file = toFile(out.blob, out.name)
      const shareable = canShareFile(file)
      const info = { file, format: out.format, name: out.name, pageCount: out.pageCount, canShare: shareable }

      if (shareable) {
        const outcome = await shareFile(file, `${t.name} - Apna Apna`)
        if (outcome === 'shared') {
          toast('Summary shared')
          return
        }
        if (outcome === 'cancelled') return // back to the app, nothing to report
        // 'needs-tap' or 'failed': keep the file so the user can tap Share again or download it.
        if (outcome === 'failed') toast('The share sheet could not open. You can download the file instead.', 'error')
      }
      setPreviewUrl(URL.createObjectURL(out.previewBlob))
      setResult(info)
    } catch (err) {
      console.error('Settlement summary failed', err)
      toast('Could not prepare the summary. You can copy the text instead.', 'error')
    } finally {
      busy.current = false
      setStage('idle')
    }
  }

  const onShareAgain = async () => {
    if (!result || sharing) return
    setSharing(true)
    const outcome = await shareFile(result.file, `${latest.current.name} - Apna Apna`)
    setSharing(false)
    if (outcome === 'shared') {
      toast('Summary shared')
      close()
    } else if (outcome === 'failed' || outcome === 'unsupported') {
      toast('Sharing is not available here. Download the file instead.', 'error')
    }
  }

  const onDownload = () => {
    downloadBlob(result.name, result.file)
    toast(`${result.format === 'pdf' ? 'PDF' : 'Image'} downloaded`)
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text())
      toast('Summary text copied')
    } catch {
      toast('Could not copy the text', 'error')
    }
  }

  const working = stage !== 'idle'
  const kind = result?.format === 'pdf' ? 'PDF' : 'image'

  return (
    <>
      <button className={className} onClick={onGenerate} disabled={working} aria-busy={working} data-share-summary>
        {working ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} {LABELS[stage]}
      </button>

      <Sheet open={Boolean(result)} onClose={close} title="Settlement summary ready">
        {result && (
          <div className="flex flex-col gap-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview of the settlement summary"
                className="mx-auto max-h-64 rounded-2xl border border-line bg-white object-contain"
              />
            )}
            <p className="text-sm leading-relaxed text-mute">
              {result.format === 'pdf'
                ? `Your summary is a ${result.pageCount}-page PDF (${result.name}).`
                : `Your summary fits one image (${result.name}).`}{' '}
              {result.canShare
                ? 'Tap Share to send it, or save it to your device.'
                : `This browser cannot share files directly, so save the ${kind} and send it from your gallery or files app.`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {result.canShare && (
                <button className="btn-primary col-span-2" onClick={onShareAgain} disabled={sharing}>
                  <Share2 size={18} /> Share {kind}
                </button>
              )}
              <button className={result.canShare ? 'btn-outline' : 'btn-primary'} onClick={onDownload}>
                <Download size={18} /> Download
              </button>
              <button className="btn-outline" onClick={onCopy}>
                <Copy size={18} /> Copy text
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}
