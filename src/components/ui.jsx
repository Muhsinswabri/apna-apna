import { formatSignedINR } from '../lib/currency.js'

export function Logo({ size = 40 }) {
  // 192px source is sharp up to ~96 CSS px on 2x screens; larger sizes use the 512px file.
  const file = size > 96 ? 'icon-512.png' : 'icon-192.png'
  return (
    <img
      src={`/icons/${file}`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="shrink-0 rounded-[22%] shadow-card"
      draggable="false"
    />
  )
}

const AVATAR_TONES = [
  'bg-[#D7E8FF] text-[#1668DC] dark:bg-[#183769] dark:text-[#8DBEFF]',
  'bg-[#EAD8FF] text-[#7B3FD1] dark:bg-[#3E2E60] dark:text-[#CDA9FF]',
  'bg-[#CFF6EA] text-[#0B8F6B] dark:bg-[#12433A] dark:text-[#5BE3BC]',
  'bg-[#FFE4D1] text-[#C25A12] dark:bg-[#4A2E1B] dark:text-[#FFB27A]',
  'bg-[#FFD9E3] text-[#C2335F] dark:bg-[#4A1F2D] dark:text-[#FF9DB8]',
  'bg-[#FFF2BF] text-[#9A7400] dark:bg-[#473A12] dark:text-[#F4CF55]',
]

export function Avatar({ name, index = 0, size = 40 }) {
  const tone = AVATAR_TONES[index % AVATAR_TONES.length]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

/** Bar colours matching the avatar tones, for per-member contribution bars. */
export const MEMBER_BAR_COLORS = ['#1677FF', '#B57BFF', '#19D3A2', '#FF9A4D', '#FF6F95', '#F2C230']

/** Who has paid what, as a stacked bar. Built from real per-member totals. */
export function ContributionBar({ rows }) {
  const total = rows.reduce((a, r) => a + r.paid, 0)
  return (
    <div
      className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-sunken"
      role="img"
      aria-label={total ? 'Share of the total paid by each member' : 'No expenses yet'}
    >
      {total > 0 &&
        rows.map((r, i) =>
          r.paid > 0 ? (
            <span
              key={r.id}
              style={{ width: `${(r.paid / total) * 100}%`, background: MEMBER_BAR_COLORS[i % MEMBER_BAR_COLORS.length] }}
            />
          ) : null,
        )}
    </div>
  )
}

export function StatusBadge({ status }) {
  const done = status === 'completed'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? 'bg-sunken text-mute' : 'bg-pos-soft text-pos'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-mute' : 'bg-pos'}`} />
      {done ? 'Completed' : 'Ongoing'}
    </span>
  )
}

/** Receive / pay / settled pill with a plain-language label. */
export function BalanceBadge({ balance, compact = false }) {
  if (balance === 0) {
    return <span className="rounded-full bg-sunken px-2.5 py-1 text-xs font-bold text-mute">Settled</span>
  }
  const receive = balance > 0
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${receive ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg'}`}
    >
      {compact ? (receive ? 'Gets back' : 'Owes') : receive ? 'Should receive' : 'Needs to pay'}
    </span>
  )
}

export function balanceTone(balance) {
  if (balance > 0) return 'text-pos'
  if (balance < 0) return 'text-neg'
  return 'text-mute'
}

export function SignedAmount({ balance, className = '' }) {
  return <span className={`font-bold tabular-nums ${balanceTone(balance)} ${className}`}>{formatSignedINR(balance)}</span>
}

export function FieldError({ children, id }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-neg">
      {children}
    </p>
  )
}
