import { Home, Plus, Settings } from 'lucide-react'
import { navigate, useRoute } from '../hooks/useRoute.js'

/** Flat bottom bar with hairline top border. The centre black circle starts a new trip. */
export function BottomNav() {
  const path = useRoute()
  const item = (to, label, Icon) => {
    const on = path === to
    return (
      <button
        onClick={() => navigate(to, { replace: true })}
        aria-current={on ? 'page' : undefined}
        aria-label={label}
        className={`flex h-12 w-14 flex-col items-center justify-center gap-1 transition ${on ? 'text-ink' : 'text-mute hover:text-ink'}`}
      >
        <Icon size={22} strokeWidth={on ? 2.2 : 1.7} />
        <span className={`h-1 w-1 rounded-full ${on ? 'bg-ink' : 'bg-transparent'}`} />
      </button>
    )
  }
  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-around px-6 py-2.5">
        {item('/', 'Trips', Home)}
        <button
          onClick={() => navigate('/new')}
          aria-label="Start a new trip"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-on-brand transition active:scale-95"
        >
          <Plus size={24} strokeWidth={2.4} />
        </button>
        {item('/settings', 'Settings', Settings)}
      </div>
    </nav>
  )
}
