import { useRef, useState } from 'react'
import { FileJson, HardDrive, Monitor, Moon, Sun, TriangleAlert, Upload, WifiOff } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { exportBackupJson } from '../lib/exporters.js'
import { InstallCard } from '../components/InstallCard.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { BottomNav } from '../components/BottomNav.jsx'
import { useToast } from '../components/Toast.jsx'
import { Logo } from '../components/ui.jsx'

const THEMES = [
  { id: 'system', label: 'Auto', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

export default function Settings() {
  const { trips, importTrips } = useTrips()
  const { pref, set } = useTheme()
  const toast = useToast()
  const fileRef = useRef(null)
  const [importError, setImportError] = useState('')

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    if (file.size > 20 * 1024 * 1024) return setImportError('This file is too large to be an Apna Apna backup.')
    const res = importTrips(await file.text())
    if (!res.ok) return setImportError(res.error)
    toast(`Imported ${res.added} ${res.added === 1 ? 'trip' : 'trips'}`)
  }

  return (
    <>
      <PageHeader title="Settings and help" backTo="/" />
      <Page nav className="flex flex-col gap-6">
        <div className="flex items-start gap-3 rounded-2xl bg-neg-soft p-4 text-sm text-neg">
          <TriangleAlert size={20} className="mt-0.5 shrink-0" />
          <p className="font-medium leading-relaxed">
            Your trip data is stored on this device. Clearing browser data or uninstalling the app may remove your saved
            trips. Export a backup before switching devices.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="section-title px-1">Appearance</h2>
          <div className="card grid grid-cols-3 gap-2 p-2" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={pref === id}
                onClick={() => set(id)}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition ${
                  pref === id ? 'bg-brand text-on-brand' : 'text-mute hover:bg-sunken'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="section-title px-1">Backup</h2>
          <div className="card flex flex-col gap-3 p-4">
            <p className="text-sm text-mute">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved on this device.
            </p>
            <button
              className="btn-outline"
              disabled={trips.length === 0}
              onClick={() => {
                exportBackupJson(trips, 'all-trips')
                toast('Backup downloaded')
              }}
            >
              <FileJson size={18} /> Export all trips (JSON)
            </button>
            <button className="btn-outline" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> Import a backup
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            {importError && (
              <p role="alert" className="text-sm font-medium text-neg">
                {importError}
              </p>
            )}
            <p className="text-xs text-mute">Imports are added as new trips. Your existing trips are never overwritten.</p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="section-title px-1">Install</h2>
          <InstallCard always />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="section-title px-1">How it works</h2>
          <div className="card flex flex-col gap-4 p-4 text-sm leading-relaxed text-mute">
            <p>
              <strong className="text-ink">1. Create a trip</strong> and enter your group&rsquo;s names once.
            </p>
            <p>
              <strong className="text-ink">2. Add expenses</strong> as you go. Pick who paid and who shared it. People can
              join or leave mid-trip from Manage Members.
            </p>
            <p>
              <strong className="text-ink">3. Check Current Status</strong> any time, then finish the trip to see the final
              balances and who pays whom.
            </p>
            <p>
              Balance = amount paid − your share of the expenses you took part in. Shares are exact to the smallest unit
              of the currency; any leftover is handed out one by one so nothing is lost.
            </p>
            <p className="flex items-center gap-2">
              <WifiOff size={16} className="shrink-0 text-accent" /> Works fully offline once installed or loaded.
            </p>
            <p className="flex items-center gap-2">
              <HardDrive size={16} className="shrink-0 text-accent" /> Nothing is sent to any server.
            </p>
          </div>
        </section>

        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Logo size={128} />
          <p className="mt-2 text-xs font-medium text-mute">Every Trip. Every Expense. Sorted.</p>
        </div>
      </Page>
      <BottomNav />
    </>
  )
}
