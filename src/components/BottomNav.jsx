import { Home, Plus, Settings } from 'lucide-react'
import { navigate, useRoute } from '../hooks/useRoute.js'

/** Floating white bottom navigation. The active tab is a black circle; "+" starts a new trip in lime. */
export function BottomNav() {
  const path = useRoute()
  const item = (to, label, Icon) => {
    const on = path === to
    return (
      <button
        onClick={() => navigate(to, { replace: true })}
        aria-current={on ? 'page' : undefined}
        aria-label={label}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
          on ? 'bg-brand text-on-brand' : 'text-mute hover:text-ink'
        }`}
      >
        <Icon size={21} strokeWidth={on ? 2.3 : 2} />
      </button>
    )
  }
  return (
    <nav aria-label="Main" className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-lg px-4 pb-3">
        <div className="pointer-events-auto flex items-center justify-around rounded-full border border-line bg-surface/95 px-4 py-2.5 shadow-nav backdrop-blur">
          {item('/', 'Trips', Home)}
          <button
            onClick={() => navigate('/new')}
            aria-label="Start a new trip"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-sun text-[#0D0D0D] transition active:scale-95"
          >
            <Plus size={24} strokeWidth={2.6} />
          </button>
          {item('/settings', 'Settings', Settings)}
        </div>
      </div>
    </nav>
  )
}
