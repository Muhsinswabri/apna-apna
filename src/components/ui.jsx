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
  'bg-[#DDE8FF] text-[#1E4EBE] dark:bg-[#24407E] dark:text-[#B5CDFF]',
  'bg-[#E6DEFF] text-[#5B3CC4] dark:bg-[#3E3274] dark:text-[#CBBDFF]',
  'bg-[#E8F5B8] text-[#4A5F0A] dark:bg-[#3E4A18] dark:text-[#D5EA86]',
  'bg-[#FFE3D6] text-[#B04E1E] dark:bg-[#4E2E22] dark:text-[#FFB894]',
  'bg-[#D9F1E8] text-[#17745A] dark:bg-[#1D4A3E] dark:text-[#8EDFC2]',
  'bg-[#FFDDE6] text-[#B03A62] dark:bg-[#4E2433] dark:text-[#FFA6C0]',
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
export const MEMBER_BAR_COLORS = ['#7563D8', '#91BFFF', '#8ED28A', '#171A35', '#E08AB0', '#B5A8F0']

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
