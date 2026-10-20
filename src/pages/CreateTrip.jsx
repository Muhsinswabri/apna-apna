import { useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { goBack, navigate } from '../hooks/useRoute.js'
import { useTrips } from '../hooks/useTrips.jsx'
import { createTrip } from '../lib/model.js'
import { DEFAULT_CURRENCY } from '../lib/currencies.js'
import { MAX_MEMBERS, MIN_MEMBERS, validateTripSetup } from '../lib/validation.js'
import { CurrencyPicker } from '../components/CurrencyPicker.jsx'
import { PlanIllustration } from '../components/illustrations.jsx'
import { TitleInput } from '../components/TitleInput.jsx'
import { useToast } from '../components/Toast.jsx'
import { Page, PageHeader } from '../components/PageHeader.jsx'
import { Avatar, FieldError } from '../components/ui.jsx'

const DEFAULT_COUNT = MIN_MEMBERS

export default function CreateTrip() {
  const { addTrip } = useTrips()
  const toast = useToast()
  const submitting = useRef(false)

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY)
  const [countInput, setCountInput] = useState(String(DEFAULT_COUNT))
  const [names, setNames] = useState(() => Array(DEFAULT_COUNT).fill(''))
  const [errors, setErrors] = useState({ memberErrors: {} })

  const parsed = /^\d+$/.test(countInput) ? Number(countInput) : NaN
  const countValid = Number.isInteger(parsed) && parsed >= MIN_MEMBERS && parsed <= MAX_MEMBERS

  const resize = (n) => {
    setNames((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ''))
  }

  const onCountChange = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 2)
    setCountInput(v)
    const n = Number(v)
    if (v && n >= MIN_MEMBERS && n <= MAX_MEMBERS) resize(n)
  }

  const step = (delta) => {
    const next = Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, (countValid ? parsed : names.length) + delta))
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
    const result = validateTripSetup({ name, currencyCode, memberCount: parsed, memberNames: names })
    setErrors(result)
    if (!result.ok) {
      toast('Please fix the highlighted fields', 'error')
      requestAnimationFrame(() =>
        document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      )
      return
    }
    submitting.current = true
    const trip = createTrip({ name, destination, currencyCode, memberNames: names })
    addTrip(trip)
    toast('Trip created')
    navigate(`/trip/${trip.id}`, { replace: true })
  }

  return (
    <>
      <PageHeader title="New trip" backTo="/" />
      <Page>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="flex-1 text-[28px] font-bold leading-[1.1] tracking-tight">Let&rsquo;s plan this trip!</h2>
          <PlanIllustration className="w-28 shrink-0" />
        </div>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <section className="card flex flex-col gap-4 p-5">
            <div>
              <label htmlFor="trip-name" className="label">
                Trip name
              </label>
              <TitleInput
                id="trip-name"
                className={`input ${errors.nameError ? 'input-error' : ''}`}
                placeholder="e.g. Wayanad Trip"
                value={name}
                maxLength={60}
                autoComplete="off"
                autoFocus
                onChange={(v) => {
                  setName(v)
                  if (errors.nameError) setErrors((p) => ({ ...p, nameError: undefined }))
                }}
                aria-invalid={Boolean(errors.nameError)}
              />
              <FieldError>{errors.nameError}</FieldError>
            </div>
            <div>
              <label htmlFor="trip-currency" className="label">
                Currency
              </label>
              <CurrencyPicker
                id="trip-currency"
                value={currencyCode}
                invalid={Boolean(errors.currencyError)}
                onChange={(code) => {
                  setCurrencyCode(code)
                  if (errors.currencyError) setErrors((p) => ({ ...p, currencyError: undefined }))
                }}
              />
              <FieldError>{errors.currencyError}</FieldError>
            </div>
            <div>
              <label htmlFor="trip-destination" className="label">
                Destination <span className="font-semibold text-mute/70">(optional)</span>
              </label>
              <TitleInput
                id="trip-destination"
                className="input"
                placeholder="e.g. Wayanad, Kerala"
                value={destination}
                maxLength={60}
                autoComplete="off"
                onChange={setDestination}
              />
            </div>
          </section>

          <section className="card p-5">
            <label htmlFor="member-count" className="label">
              How many people?
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-outline h-[54px] w-[54px] shrink-0 !px-0"
                onClick={() => step(-1)}
                disabled={countValid && parsed <= MIN_MEMBERS}
                aria-label="Fewer members"
              >
                <Minus size={20} strokeWidth={2.8} />
              </button>
              <input
                id="member-count"
                className={`input text-center text-xl font-bold ${errors.countError ? 'input-error' : ''}`}
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
                <Plus size={20} strokeWidth={2.8} />
              </button>
            </div>
            <FieldError>{errors.countError}</FieldError>
          </section>

          <fieldset className="card p-5">
            <legend className="label float-left">Who is coming?</legend>
            <p className="clear-both mb-3 text-[13px] font-medium text-mute">
              Names are saved once and reused for every expense. People can join or leave later. At least 2 members are needed.
            </p>
            <div className="flex flex-col gap-3">
              {names.map((value, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <Avatar name={value || String(i + 1)} index={i} size={44} />
                    <TitleInput
                      className={`input ${errors.memberErrors[i] ? 'input-error' : ''}`}
                      placeholder={`Member ${i + 1} name`}
                      value={value}
                      maxLength={40}
                      autoComplete="off"
                      aria-label={`Member ${i + 1} name`}
                      aria-invalid={Boolean(errors.memberErrors[i])}
                      onChange={(v) => setMemberName(i, v)}
                    />
                  </div>
                  <div className="pl-14">
                    <FieldError>{errors.memberErrors[i]}</FieldError>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="mt-2 grid grid-cols-[auto_1fr] gap-3">
            <button type="button" className="btn-outline h-14" onClick={() => goBack('/')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary h-14 text-base">
              Create Trip
            </button>
          </div>
        </form>
      </Page>
    </>
  )
}
