import { useCallback, useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../lib/storage.js'

const META_COLORS = { light: '#FFFFFF', dark: '#0C0C0B' }

function resolve(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(pref) {
  const mode = resolve(pref)
  if (mode === 'dark') document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[mode])
  return mode
}

/** pref: 'system' | 'light' | 'dark'. mode: what is actually showing. */
export function useTheme() {
  const [pref, setPref] = useState(loadTheme)
  const [mode, setMode] = useState(() => resolve(loadTheme()))

  useEffect(() => {
    setMode(apply(pref))
    if (pref !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode(apply('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const set = useCallback((next) => {
    saveTheme(next)
    setPref(next)
  }, [])

  const toggle = useCallback(() => set(mode === 'dark' ? 'light' : 'dark'), [mode, set])

  return { pref, mode, set, toggle }
}
