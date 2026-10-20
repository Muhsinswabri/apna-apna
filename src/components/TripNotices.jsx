import { TriangleAlert, X } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.jsx'

/** Banners for storage problems: recovered data or failed saves. */
export function TripNotices() {
  const { loadStatus, saveFailed, dismissLoadStatus } = useTrips()
  return (
    <>
      {loadStatus === 'recovered' && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-neg-soft p-4 text-sm text-neg">
          <TriangleAlert size={20} className="mt-0.5 shrink-0" />
          <p className="flex-1 font-medium">
            Some saved data could not be read. The original was kept as a backup in this browser, and everything
            readable was restored.
          </p>
          <button onClick={dismissLoadStatus} aria-label="Dismiss" className="shrink-0">
            <X size={18} />
          </button>
        </div>
      )}
      {loadStatus === 'unavailable' && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-neg-soft p-4 text-sm font-medium text-neg">
          <TriangleAlert size={20} className="mt-0.5 shrink-0" />
          <p>Browser storage is unavailable (private mode?). Trips will not be saved after you close this tab.</p>
        </div>
      )}
      {saveFailed && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-neg-soft p-4 text-sm font-medium text-neg">
          <TriangleAlert size={20} className="mt-0.5 shrink-0" />
          <p>The last change could not be saved. Storage may be full. Export a backup from Settings.</p>
        </div>
      )}
    </>
  )
}
