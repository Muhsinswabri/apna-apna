import { BarChart3, Home, Map, Plus, Zap } from 'lucide-react'
import { navigate, useRoute } from '../hooks/useRoute.js'

const LEFT = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/trips', label: 'Trips', Icon: Map },
]
const RIGHT = [
  { to: '/activity', label: 'Activity', Icon: Zap },
  { to: '/insights', label: 'Insights', Icon: BarChart3 },
]

/**
 * Compact bottom navigation with a raised centre button that starts a new trip.
 * Settings lives in the header of each screen, so the bar stays short.
 */
export function BottomNav() {
  const path = useRoute()
  const tab = ({ to, label, Icon }) => {
    const on = path === to
    return (
      <li key={to} className="flex-1">
        <button
          onClick={() => navigate(to, { replace: true })}
          aria-current={on ? 'page' : undefined}
          className={`flex min-h-[48px] w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold transition ${on ? 'text-accent' : 'text-mute hover:text-ink'}`}
        >
          <span className={`flex h-7 w-11 items-center justify-center rounded-full transition ${on ? 'bg-brand-soft' : ''}`}>
            <Icon size={19} strokeWidth={on ? 2.3 : 1.9} />
          </span>
          {label}
        </button>
      </li>
    )
  }
  return (
    <nav aria-label="Main" className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="relative mx-auto max-w-lg px-3 pb-2.5">
        <ul className="pointer-events-auto flex items-center rounded-[30px] border border-line/60 bg-surface/95 px-2 py-1.5 shadow-nav backdrop-blur">
          {LEFT.map(tab)}
          <li className="w-[76px] shrink-0" aria-hidden="true" />
          {RIGHT.map(tab)}
        </ul>
        <button
          onClick={() => navigate('/new')}
          aria-label="Start a new trip"
          className="pointer-events-auto absolute -top-6 left-1/2 flex h-[58px] w-[58px] -translate-x-1/2 items-center justify-center rounded-full bg-brand text-on-brand shadow-pop ring-[7px] ring-bg transition active:scale-95"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  )
}
