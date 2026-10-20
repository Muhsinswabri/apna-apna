import { Download, Share, SquarePlus } from 'lucide-react'
import { useInstall } from '../hooks/useInstall.js'

/** Install help: native prompt where supported, manual steps otherwise. */
export function InstallCard({ always = false }) {
  const { installed, canPrompt, ios, install } = useInstall()
  if (installed) {
    return always ? (
      <p className="text-sm text-mute">Apna Apna is installed on this device and works offline.</p>
    ) : null
  }
  if (!canPrompt && !ios && !always) return null

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Download size={20} />
        </div>
        <div>
          <p className="font-bold">Install Apna Apna</p>
          <p className="text-sm text-mute">Add it to your home screen. Opens full screen and works offline.</p>
        </div>
      </div>
      {canPrompt && (
        <button className="btn-primary btn-sm" onClick={install}>
          <Download size={16} /> Install app
        </button>
      )}
      {!canPrompt && ios && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-mute">
          Tap <Share size={16} className="text-brand" /> Share, then <SquarePlus size={16} className="text-brand" /> Add to
          Home Screen.
        </p>
      )}
      {!canPrompt && !ios && always && (
        <p className="text-sm text-mute">
          Use your browser menu and choose Install app or Add to Home screen.
        </p>
      )}
    </div>
  )
}
