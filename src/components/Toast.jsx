import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(0)

  const show = useCallback((message, type = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, type, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const value = useMemo(() => show, [show])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {toast && (
          <div
            key={toast.key}
            role="status"
            className="pointer-events-auto flex animate-rise items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-semibold text-bg shadow-2xl"
          >
            {toast.type === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
