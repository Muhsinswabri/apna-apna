import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { resolveCurrency, searchCurrencies } from '../lib/currencies.js'
import { Sheet } from './Sheet.jsx'

/** Searchable currency chooser. Works fully offline from the bundled list. */
export function CurrencyPicker({ id, value, onChange, invalid }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const current = resolveCurrency(value)
  const results = useMemo(() => searchCurrencies(query), [query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        type="button"
        id={id}
        className={`input flex items-center gap-3 text-left ${invalid ? 'input-error' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Currency: ${current.name} (${current.code}). Change`}
      >
        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-soft px-2 text-sm font-bold text-accent">
          {current.symbol}
        </span>
        <span className="min-w-0 flex-1 truncate font-bold">
          {current.name} <span className="font-semibold text-mute">· {current.code}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-mute" />
      </button>

      <Sheet open={open} onClose={close} title="Choose currency">
        <div className="relative mb-3">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="search"
            className="input !pl-11"
            placeholder="Search name, code or symbol"
            value={query}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search currencies"
          />
        </div>
        <ul className="-mx-1 max-h-[52dvh] overflow-y-auto" role="listbox" aria-label="Currencies">
          {results.length === 0 && <li className="p-6 text-center text-sm text-mute">No currency matches &ldquo;{query}&rdquo;.</li>}
          {results.map((c) => {
            const on = c.code === current.code
            return (
              <li key={c.code} role="option" aria-selected={on}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-sunken active:bg-sunken"
                  onClick={() => {
                    onChange(c.code)
                    close()
                  }}
                >
                  <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-sunken px-2 text-sm font-bold">
                    {c.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{c.name}</span>
                    <span className="block text-xs font-semibold text-mute">{c.code}</span>
                  </span>
                  {on && <Check size={18} className="shrink-0 text-accent" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </>
  )
}
