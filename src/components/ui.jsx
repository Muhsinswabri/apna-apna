import { formatSignedMoney } from '../lib/currency.js'

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
  'bg-[#E4E4E4] text-[#111111] dark:bg-[#383838] dark:text-[#F5F5F5]',
  'bg-[#F0F0F0] text-[#111111] dark:bg-[#2A2A2A] dark:text-[#F5F5F5]',
  'bg-[#DADADA] text-[#111111] dark:bg-[#454545] dark:text-[#F5F5F5]',
  'bg-[#F0F0F0] text-[#111111] dark:bg-[#2A2A2A] dark:text-[#F5F5F5]',
  'bg-[#E4E4E4] text-[#111111] dark:bg-[#383838] dark:text-[#F5F5F5]',
  'bg-[#DADADA] text-[#111111] dark:bg-[#454545] dark:text-[#F5F5F5]',
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
export const MEMBER_BAR_COLORS = ['#111111', '#8A8A8A', '#C9C9C9', '#444444', '#E2E2E2', '#666666']

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

/** Small "Left" tag for members who have left the trip. */
export function LeftTag() {
  return <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-bold text-mute">Left</span>
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
      {compact ? (receive ? 'Gets back' : 'Owes') : receive ? 'To receive' : 'To pay'}
    </span>
  )
}

export function balanceTone(balance) {
  if (balance > 0) return 'text-pos'
  if (balance < 0) return 'text-neg'
  return 'text-mute'
}

export function SignedAmount({ balance, currency, className = '' }) {
  return (
    <span className={`font-bold tabular-nums ${balanceTone(balance)} ${className}`}>
      {formatSignedMoney(balance, currency)}
    </span>
  )
}

export function FieldError({ children, id }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-neg">
      {children}
    </p>
  )
}
