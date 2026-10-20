import { Home, Plus, Settings } from 'lucide-react'
import { navigate, useRoute } from '../hooks/useRoute.js'

/** Mobile bottom navigation for the top-level screens. */
export function BottomNav() {
  const path = useRoute()
  const item = (to, label, Icon) => {
    const on = path === to
    return (
      <button
        onClick={() => navigate(to, { replace: true })}
        aria-current={on ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-bold transition ${on ? 'text-brand' : 'text-mute'}`}
      >
        <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${on ? 'bg-brand-soft' : ''}`}>
          <Icon size={21} strokeWidth={on ? 2.4 : 2} />
        </span>
        {label}
      </button>
    )
  }
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-surface/90 shadow-nav backdrop-blur-lg"
    >
      <div className="mx-auto flex max-w-lg items-end px-4">
        {item('/', 'Trips', Home)}
        <div className="flex flex-1 justify-center pb-2">
          <button
            onClick={() => navigate('/new')}
            aria-label="Start a new trip"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-float transition active:scale-95"
          >
            <Plus size={26} />
          </button>
        </div>
        {item('/settings', 'Settings', Settings)}
      </div>
    </nav>
  )
}
