import { ArrowLeft } from 'lucide-react'
import { goBack } from '../hooks/useRoute.js'

export function PageHeader({ title, subtitle, backTo = '/', actions, badge }) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-lg items-center gap-3 px-4">
        <button
          onClick={() => goBack(backTo)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-pop-sm transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold leading-tight tracking-tight">{title}</h1>
          {(subtitle || badge) && (
            <div className="flex items-center gap-2">
              {subtitle && <p className="truncate text-xs font-semibold text-mute">{subtitle}</p>}
              {badge}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  )
}

export function IconButton({ label, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-pop-sm transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  )
}

export function Page({ children, className = '', nav = false }) {
  return (
    <main className={`mx-auto w-full max-w-lg animate-rise px-4 pt-3 ${nav ? 'pb-40' : 'pb-16'} ${className}`}>
      {children}
    </main>
  )
}
