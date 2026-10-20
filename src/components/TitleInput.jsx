import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { normalizeName, toTitleCase } from '../lib/text.js'

/**
 * Text input that capitalises the first letter of every word as you type or
 * paste. `onChange` receives the new string (not the event). It keeps the
 * caret where it was, waits for IME composition to finish, and tidies
 * spacing when you leave the field.
 */
export const TitleInput = forwardRef(function TitleInput({ value, onChange, onBlur, ...rest }, ref) {
  const inner = useRef(null)
  const caret = useRef(null)
  const composing = useRef(false)
  useImperativeHandle(ref, () => inner.current)

  // After React writes the transformed value the caret would jump to the end.
  useLayoutEffect(() => {
    const el = inner.current
    if (el && caret.current !== null && document.activeElement === el) {
      try {
        el.setSelectionRange(caret.current, caret.current)
      } catch {
        /* some input types have no selection */
      }
    }
    caret.current = null
  })

  const emit = (el) => {
    caret.current = el.selectionStart
    onChange(composing.current ? el.value : toTitleCase(el.value))
  }

  return (
    <input
      {...rest}
      ref={inner}
      value={value}
      autoCapitalize="words"
      onChange={(e) => emit(e.target)}
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={(e) => {
        composing.current = false
        emit(e.target)
      }}
      onBlur={(e) => {
        const clean = normalizeName(e.target.value)
        if (clean !== value) onChange(clean)
        onBlur?.(e)
      }}
    />
  )
})
