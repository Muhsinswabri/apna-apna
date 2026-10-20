import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEY, importBackup, loadTrips, saveTrips } from '../lib/storage.js'
import { touch } from '../lib/model.js'

const TripsContext = createContext(null)

export function TripsProvider({ children }) {
  const initial = useRef(null)
  if (initial.current === null) initial.current = loadTrips()

  const [trips, setTrips] = useState(initial.current.trips)
  const [loadStatus, setLoadStatus] = useState(initial.current.status)
  const [saveFailed, setSaveFailed] = useState(false)
  // The ref always holds the latest list so rapid updates never use stale state.
  const ref = useRef(trips)

  const commit = useCallback((next) => {
    const ok = saveTrips(next)
    ref.current = next
    setTrips(next)
    setSaveFailed(!ok)
    return ok
  }, [])

  // Pick up changes made in another tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      const fresh = loadTrips()
      ref.current = fresh.trips
      setTrips(fresh.trips)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const api = useMemo(
    () => ({
      trips,
      loadStatus,
      saveFailed,
      dismissLoadStatus: () => setLoadStatus('ok'),
      addTrip: (trip) => commit([trip, ...ref.current]),
      /** updater: (trip) => newTrip. Stamps updatedAt automatically. */
      updateTrip: (id, updater) =>
        commit(ref.current.map((t) => (t.id === id ? touch(updater(t), {}) : t))),
      removeTrip: (id) => commit(ref.current.filter((t) => t.id !== id)),
      importTrips: (text) => {
        const res = importBackup(text, ref.current)
        if (res.ok) commit(res.trips)
        return res
      },
    }),
    [trips, loadStatus, saveFailed, commit],
  )

  return <TripsContext.Provider value={api}>{children}</TripsContext.Provider>
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used inside TripsProvider')
  return ctx
}
