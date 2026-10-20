import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({ open, onClose, title, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 animate-fade bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="safe-bottom relative max-h-[88dvh] w-full max-w-lg animate-sheet overflow-y-auto rounded-t-[28px] bg-surface p-5 shadow-2xl outline-none sm:rounded-[28px]"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-mute hover:bg-sunken" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <p className="mb-5 text-[15px] leading-relaxed text-mute">{message}</p>
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
