import { useRef, useState } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { goBack, navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { createTrip } from '../lib/model.js'
import { MAX_MEMBERS, normalizeName, validateTripSetup } from '../lib/validation.js'
import { useToast } from '../components/Toast.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { Avatar, FieldError } from '../components/ui.jsx'

const DEFAULT_COUNT = 2
const STEPS = ['Trip', 'Members', 'Names']

function Stepper({ done }) {
  const active = done.findIndex((d) => !d)
  return (
    <ol className="mb-6 flex items-center" aria-label="Progress">
      {STEPS.map((label, i) => {
        const isDone = done[i]
        const isActive = i === active
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={isActive ? 'step' : undefined}>
            <span className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                  isDone
                    ? 'bg-brand text-on-brand'
                    : isActive
                      ? 'border-2 border-brand bg-surface text-brand'
                      : 'border border-line bg-surface text-mute'
                }`}
              >
                {isDone ? <Check size={18} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-[11px] font-bold ${isDone || isActive ? 'text-ink' : 'text-mute'}`}>{label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition ${isDone ? 'bg-brand' : 'bg-line'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepCard({ n, title, hint, children }) {
  return (
    <section className="card p-5" aria-label={`Step ${n}: ${title}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-extrabold text-brand">
          {n}
        </span>
        <div>
          <h2 className="font-extrabold leading-tight">{title}</h2>
          {hint && <p className="text-[13px] text-mute">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function CreateTrip() {
  const { addTrip } = useTrips()
  const toast = useToast()
  const submitting = useRef(false)

  const [name, setName] = useState('')
  const [countInput, setCountInput] = useState(String(DEFAULT_COUNT))
  const [names, setNames] = useState(() => Array(DEFAULT_COUNT).fill(''))
  const [errors, setErrors] = useState({ memberErrors: {} })

  const parsed = /^\d+$/.test(countInput) ? Number(countInput) : NaN
  const countValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_MEMBERS

  // A step only counts as done once every earlier step is done.
  const step1 = Boolean(normalizeName(name))
  const step2 = step1 && countValid
  const step3 = step2 && names.every((n) => Boolean(normalizeName(n)))
  const stepsDone = [step1, step2, step3]

  const resize = (n) => {
    setNames((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ''))
  }

  const onCountChange = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 2)
    setCountInput(v)
    const n = Number(v)
    if (v && n >= 1 && n <= MAX_MEMBERS) resize(n)
  }

  const step = (delta) => {
    const next = Math.min(MAX_MEMBERS, Math.max(1, (countValid ? parsed : names.length) + delta))
    setCountInput(String(next))
    resize(next)
  }

  const setMemberName = (i, value) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)))
    setErrors((prev) => {
      if (!prev.memberErrors[i]) return prev
      const { [i]: _drop, ...rest } = prev.memberErrors
      return { ...prev, memberErrors: rest }
    })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (submitting.current) return
    const result = validateTripSetup({ name, memberCount: parsed, memberNames: names })
    setErrors(result)
    if (!result.ok) {
      toast('Please fix the highlighted fields', 'error')
      requestAnimationFrame(() =>
        document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      )
      return
    }
    submitting.current = true
    const trip = createTrip({ name, memberNames: names })
    addTrip(trip)
    toast('Trip created')
    navigate(`/trip/${trip.id}`, { replace: true })
  }

  return (
    <>
      <PageHeader title="New trip" subtitle="Add your group once. We remember them." backTo="/" />
      <Page>
        <Stepper done={stepsDone} />
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <StepCard n={1} title="Name your trip" hint="Where are you headed?">
            <label htmlFor="trip-name" className="sr-only">
              Trip name
            </label>
            <input
              id="trip-name"
              className={`input ${errors.nameError ? 'input-error' : ''}`}
              placeholder="e.g. Wayanad Trip"
              value={name}
              maxLength={60}
              autoComplete="off"
              autoFocus
              onChange={(e) => {
                setName(e.target.value)
                if (errors.nameError) setErrors((p) => ({ ...p, nameError: undefined }))
              }}
              aria-invalid={Boolean(errors.nameError)}
            />
            <FieldError>{errors.nameError}</FieldError>
          </StepCard>

          <StepCard n={2} title="How many people?" hint={`Between 1 and ${MAX_MEMBERS}`}>
            <label htmlFor="member-count" className="sr-only">
              Number of members
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-outline h-[54px] w-[54px] shrink-0 !px-0"
                onClick={() => step(-1)}
                disabled={countValid && parsed <= 1}
                aria-label="Fewer members"
              >
                <Minus size={20} />
              </button>
              <input
                id="member-count"
                className={`input text-center text-xl font-extrabold ${errors.countError ? 'input-error' : ''}`}
                inputMode="numeric"
                value={countInput}
                onChange={(e) => onCountChange(e.target.value)}
                aria-invalid={Boolean(errors.countError)}
              />
              <button
                type="button"
                className="btn-outline h-[54px] w-[54px] shrink-0 !px-0"
                onClick={() => step(1)}
                disabled={countValid && parsed >= MAX_MEMBERS}
                aria-label="More members"
              >
                <Plus size={20} />
              </button>
            </div>
            <FieldError>{errors.countError}</FieldError>
          </StepCard>

          <StepCard n={3} title="Who is coming?" hint="Names are saved once and reused for every expense">
            <div className="flex flex-col gap-3">
              {names.map((value, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <Avatar name={value || String(i + 1)} index={i} size={44} />
                    <input
                      className={`input ${errors.memberErrors[i] ? 'input-error' : ''}`}
                      placeholder={`Member ${i + 1} name`}
                      value={value}
                      maxLength={40}
                      autoComplete="off"
                      aria-label={`Member ${i + 1} name`}
                      aria-invalid={Boolean(errors.memberErrors[i])}
                      onChange={(e) => setMemberName(i, e.target.value)}
                    />
                  </div>
                  <div className="pl-14">
                    <FieldError>{errors.memberErrors[i]}</FieldError>
                  </div>
                </div>
              ))}
            </div>
          </StepCard>

          <div className="mt-2 grid grid-cols-[auto_1fr] gap-3">
            <button type="button" className="btn-outline" onClick={() => goBack('/')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Trip
            </button>
          </div>
        </form>
      </Page>
    </>
  )
}
