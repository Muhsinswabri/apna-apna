import { getMemberAvatar } from '../lib/avatars.js'
import { Avatar } from './ui.jsx'

const INK = '#171A35'

export function Art({ a }) {
  const faceY = a.style === 'hijab' ? 31 : 28
  const faceR = a.style === 'hijab' ? 12 : 13
  return (
    <svg viewBox="0 0 64 64" className="block h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="64" height="64" fill={a.bg} />
      {a.style === 'long' && <rect x="15" y="13" width="34" height="38" rx="15" fill={a.hair} />}
      {a.style === 'bob' && <rect x="15" y="14" width="34" height="28" rx="14" fill={a.hair} />}
      <path d="M8 64 C8 50 19 46 32 46 C45 46 56 50 56 64Z" fill={a.shirt} />
      {a.style === 'hijab' ? (
        <path d="M10 64 C7 36 12 8 32 8 C52 8 57 36 54 64Z" fill={a.hair} />
      ) : (
        <rect x="28" y="38" width="8" height="11" rx="3" fill={a.skin} />
      )}
      <circle cx="32" cy={faceY} r={faceR} fill={a.skin} />
      {a.style === 'short' && <path d="M19 28 C18 13 46 13 45 28 C41 20 23 20 19 28Z" fill={a.hair} />}
      {(a.style === 'long' || a.style === 'bob') && <path d="M19 28 C19 14 45 14 45 28 C40 19 25 19 19 28Z" fill={a.hair} />}
      {a.style === 'curly' && (
        <g fill={a.hair}>
          <circle cx="22" cy="19" r="7" />
          <circle cx="32" cy="14.5" r="8" />
          <circle cx="42" cy="19" r="7" />
          <circle cx="18.5" cy="26" r="5" />
          <circle cx="45.5" cy="26" r="5" />
        </g>
      )}
      {a.style === 'bun' && (
        <g fill={a.hair}>
          <circle cx="32" cy="11" r="6" />
          <path d="M19 28 C18 13 46 13 45 28 C41 20 23 20 19 28Z" />
        </g>
      )}
      {a.style === 'cap' && (
        <g fill={a.hair}>
          <path d="M18.5 25 C18.5 10 45.5 10 45.5 25Z" />
          <rect x="27" y="23.5" width="23" height="4.5" rx="2.2" />
        </g>
      )}
      {a.style === 'beard' && (
        <g fill={a.hair}>
          <path d="M19 28 C18 13 46 13 45 28 C41 20 23 20 19 28Z" />
          <path d="M19.5 30 C19.5 46 44.5 46 44.5 30 C41 38 23 38 19.5 30Z" />
        </g>
      )}
      {a.style === 'spiky' && <path d="M19 28 L22 12 L27 20 L32 9 L37 20 L42 12 L45 28 C40 20 24 20 19 28Z" fill={a.hair} />}
      <circle cx="26.5" cy={faceY + 1} r="1.7" fill={INK} />
      <circle cx="37.5" cy={faceY + 1} r="1.7" fill={INK} />
      <circle cx="23.5" cy={faceY + 6} r="2.6" fill="#FF9AA2" opacity=".5" />
      <circle cx="40.5" cy={faceY + 6} r="2.6" fill="#FF9AA2" opacity=".5" />
      <path d={`M28.5 ${faceY + 7} q3.5 3.6 7 0`} fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
      {a.glasses && (
        <g fill="none" stroke={INK} strokeWidth="1.5">
          <circle cx="26.5" cy={faceY + 1} r="4.6" />
          <circle cx="37.5" cy={faceY + 1} r="4.6" />
          <path d={`M31 ${faceY + 1} h2`} />
        </g>
      )}
    </svg>
  )
}

/**
 * A member's illustrated avatar, drawn from the avatarId saved on the member. Anything with
 * { id, name, avatarId } works (trip members and the per-member rows from computeTripStats).
 * A missing or unknown avatar falls back to a pastel initials circle, never a blank one.
 */
export function MemberAvatar({ member, size = 40 }) {
  const art = getMemberAvatar(member)
  if (!art) {
    // Stable pastel tone from the member's id, so the fallback does not shift either.
    let tone = 0
    for (const ch of String(member?.id ?? member?.name ?? '')) tone = (tone + ch.charCodeAt(0)) % 6
    return <Avatar name={member?.name ?? '?'} index={tone} size={size} />
  }
  return (
    <span
      className="inline-block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      aria-hidden="true"
      data-avatar={art.id}
    >
      <Art a={art} />
    </span>
  )
}
