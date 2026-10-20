import { useSyncExternalStore } from 'react'

// Tiny hash router. Hash URLs work offline and on any static host without rewrites.
const listeners = new Set()

function currentPath() {
  const p = window.location.hash.replace(/^#/, '').split('?')[0]
  return p || '/'
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  window.addEventListener('hashchange', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
    window.removeEventListener('hashchange', listener)
  }
}

export function navigate(path, { replace = false } = {}) {
  if (replace) window.history.replaceState({ appNav: window.history.state?.appNav ?? false }, '', `#${path}`)
  else window.history.pushState({ appNav: true }, '', `#${path}`)
  emit()
  window.scrollTo(0, 0)
}

/** Go back inside the app; if this page was opened directly, go to `fallback`. */
export function goBack(fallback = '/') {
  if (window.history.state?.appNav) window.history.back()
  else navigate(fallback, { replace: true })
}

export function useRoute() {
  return useSyncExternalStore(subscribe, currentPath, () => '/')
}

/** Match "/trip/:id/expense/:eid" style patterns. Returns params or null. */
export function matchRoute(pattern, path) {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}
