import { useEffect, useState } from 'react'
import { ArrowRight, Receipt, Scale, Users, Wallet } from 'lucide-react'
import { FriendsHero, ReceiptIllustration, SettleIllustration } from '../components/illustrations.jsx'
import { Logo } from '../components/ui.jsx'

const SLIDES = [
  {
    bg: 'bg-mint',
    title: 'Trips Are Better Together',
    text: 'Keep every expense organized and know exactly who owes whom.',
    Art: FriendsHero,
    chips: [
      { Icon: Users, label: 'One crew, one trip', pos: 'left-0 top-3 -rotate-3' },
      { Icon: Scale, label: 'Fair for everyone', pos: 'right-0 bottom-6 rotate-2' },
    ],
  },
  {
    bg: 'bg-lav',
    title: 'Every Expense, Sorted',
    text: 'Record who paid, choose who shares, and keep every trip organized.',
    Art: ReceiptIllustration,
    chips: [
      { Icon: Wallet, label: 'Who paid', pos: 'left-0 top-4 -rotate-3' },
      { Icon: Receipt, label: 'Who shares', pos: 'right-0 bottom-6 rotate-2' },
    ],
  },
  {
    bg: 'bg-sky',
    title: 'Settle Without the Confusion',
    text: "See everyone's balance and the easiest way to settle up.",
    Art: SettleIllustration,
    chips: [{ Icon: Scale, label: 'Clear balances', pos: 'right-0 top-4 rotate-2' }],
  },
]

/** Three short intro screens. `onDone` runs on Skip, on the last "Get Started", and nowhere else. */
export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const last = step === SLIDES.length - 1
  const next = () => (last ? onDone() : setStep((s) => s + 1))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, SLIDES.length - 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className={`safe-top safe-bottom min-h-dvh transition-colors duration-300 ${slide.bg}`}>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={38} />
            <span className="text-[17px] font-extrabold">Apna Apna</span>
          </div>
          <button
            onClick={onDone}
            className="rounded-2xl border border-navy/15 bg-surface/70 px-5 py-2.5 text-sm font-bold transition active:scale-95"
          >
            Skip
          </button>
        </div>

        <div className="relative my-6 flex flex-1 items-center justify-center" aria-hidden="true">
          <div className="absolute inset-x-6 top-1/2 h-[78%] max-h-[330px] -translate-y-1/2 -rotate-3 rounded-[34px] bg-surface/50" />
          <div className="relative w-full max-w-[330px] rounded-[34px] bg-surface p-5 shadow-card">
            <slide.Art className="w-full" key={step} />
          </div>
          {slide.chips.map(({ Icon, label, pos }) => (
            <span
              key={label}
              className={`absolute flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-[13px] font-extrabold shadow-card ${pos}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                <Icon size={15} />
              </span>
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-1.5" role="tablist" aria-label="Intro progress">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === step}
                aria-label={`Screen ${i + 1} of ${SLIDES.length}`}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full bg-navy transition-all ${i === step ? 'w-8' : 'w-1.5 opacity-30'}`}
              />
            ))}
          </div>
          <div aria-live="polite">
            <h1 className="text-[30px] font-extrabold leading-[1.1]">{slide.title}</h1>
            <p className="mx-auto mt-3 max-w-[320px] text-[15px] font-medium leading-relaxed text-ink/70">{slide.text}</p>
          </div>
          {last ? (
            <button onClick={next} className="btn-primary mt-8 h-14 w-full text-base">
              Get Started <ArrowRight size={19} />
            </button>
          ) : (
            <button
              onClick={next}
              aria-label="Next"
              className="mt-8 flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand text-on-brand shadow-pop transition active:scale-95"
            >
              <ArrowRight size={24} />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
