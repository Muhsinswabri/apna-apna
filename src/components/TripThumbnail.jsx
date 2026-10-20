import { DEFAULT_TRIP_IMAGE, getTripImageAsset } from '../lib/tripImages.js'

// Original, lightweight scene illustrations, one per trip category. They are drawn in code, so
// they are bundled with the app, work offline and cannot break like a remote image can.
// Every scene fills a 56 x 56 square and is scaled with "slice", like object-fit: cover.

const INK = '#171A35'

const SCENES = {
  hills: () => (
    <>
      <rect width="56" height="56" fill="#DDEFFF" />
      <circle cx="44" cy="13" r="6" fill="#FFE59A" />
      <ellipse cx="14" cy="14" rx="8" ry="3.4" fill="#fff" />
      <circle cx="11" cy="12.5" r="3.6" fill="#fff" />
      <circle cx="17" cy="12" r="4" fill="#fff" />
      <path d="M-4 38 Q10 20 24 32 T60 28 V56 H-4Z" fill="#A6DCA2" />
      <path d="M-4 46 Q14 30 30 42 T60 38 V56 H-4Z" fill="#6FBF73" />
      <path d="M-4 54 Q20 42 40 50 T60 48 V56 H-4Z" fill="#4FA662" />
      <g fill="#3E8F55">
        <path d="M13 38 l3.5-9 3.5 9z" />
        <path d="M39 41 l3.5-10 3.5 10z" />
        <path d="M24 46 l3-8 3 8z" />
      </g>
    </>
  ),
  tea: () => (
    <>
      <rect width="56" height="56" fill="#E4F3FF" />
      <circle cx="12" cy="12" r="5.5" fill="#FFE59A" />
      <path d="M-4 34 L12 18 L24 30 L36 14 L60 36 V56 H-4Z" fill="#B6D4F0" />
      <path d="M-4 42 Q16 26 32 34 T60 32 V56 H-4Z" fill="#7CC47F" />
      <g fill="none" stroke="#4F9F5B" strokeWidth="2.2" strokeLinecap="round">
        <path d="M-2 44 Q26 32 58 42" />
        <path d="M-2 49 Q26 37 58 47" />
        <path d="M-2 54 Q26 42 58 52" />
      </g>
      <rect x="38" y="31" width="9" height="7" fill="#FFE3C4" />
      <path d="M36 32 l6.5-6 6.5 6z" fill="#E58A6A" />
    </>
  ),
  beach: () => (
    <>
      <rect width="56" height="56" fill="#FFE9C9" />
      <circle cx="43" cy="16" r="8" fill="#FFB36B" />
      <rect y="32" width="56" height="14" fill="#6FB6F0" />
      <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".85">
        <path d="M6 37 q3-2.5 6 0 t6 0" />
        <path d="M30 41 q3-2.5 6 0 t6 0" />
      </g>
      <path d="M-4 46 Q28 40 60 46 V56 H-4Z" fill="#F6D9A0" />
      <path d="M15 52 Q13 36 18 22" fill="none" stroke="#8A5A3A" strokeWidth="2.6" strokeLinecap="round" />
      <g fill="#3FA66B">
        <ellipse cx="11" cy="22" rx="8" ry="3" transform="rotate(-24 11 22)" />
        <ellipse cx="25" cy="21" rx="8" ry="3" transform="rotate(22 25 21)" />
        <ellipse cx="18" cy="17" rx="3" ry="7" />
      </g>
      <path d="M38 52 V41" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 42 a8 8 0 0 1 16 0Z" fill="#FF7A8A" />
    </>
  ),
  skyline: () => (
    <>
      <rect width="56" height="56" fill="#D6D0FF" />
      <circle cx="46" cy="12" r="5" fill="#FFF3C4" />
      <g fill="#6A70C4">
        <rect x="3" y="30" width="10" height="26" rx="1.5" />
        <rect x="14" y="38" width="8" height="18" rx="1.5" />
        <rect x="35" y="26" width="9" height="30" rx="1.5" />
        <rect x="45" y="36" width="12" height="20" rx="1.5" />
      </g>
      <path d="M28 5 L30.2 22 L34 56 H22 L25.8 22Z" fill="#3B3F7A" />
      <rect x="27.3" y="5" width="1.4" height="6" fill="#3B3F7A" />
      <g fill="#fff" opacity=".7">
        <rect x="6" y="35" width="2" height="2" />
        <rect x="9" y="41" width="2" height="2" />
        <rect x="38" y="32" width="2" height="2" />
        <rect x="38" y="40" width="2" height="2" />
        <rect x="49" y="42" width="2" height="2" />
      </g>
      <rect y="50" width="56" height="6" fill="#8EC5FF" />
    </>
  ),
  snow: () => (
    <>
      <rect width="56" height="56" fill="#CFE3FF" />
      <path d="M-2 42 L22 10 L46 42Z" fill="#9DB9E6" />
      <path d="M22 10 L15.5 20 L19 18.5 L22 23 L26 18 L29 20Z" fill="#fff" />
      <path d="M24 46 L42 18 L62 46Z" fill="#7C9BD6" />
      <path d="M42 18 L36.5 26 L40 25 L42 28.5 L45.5 24.5 L48 27Z" fill="#fff" />
      <path d="M-4 46 Q20 40 40 46 T62 44 V56 H-4Z" fill="#F4F8FF" />
      <g fill="#3F7D63">
        <path d="M8 50 l3.5-10 3.5 10z" />
        <path d="M16 52 l3-8 3 8z" />
        <path d="M46 52 l3.5-10 3.5 10z" />
      </g>
    </>
  ),
  city: () => (
    <>
      <rect width="56" height="56" fill="#E1F1FF" />
      <circle cx="46" cy="12" r="5.5" fill="#FFE59A" />
      <rect x="3" y="26" width="11" height="30" rx="2" fill="#7563D8" />
      <rect x="15" y="14" width="12" height="42" rx="2" fill="#5B49BD" />
      <rect x="28" y="30" width="10" height="26" rx="2" fill="#B5A8F0" />
      <rect x="39" y="22" width="12" height="34" rx="2" fill="#91BFFF" />
      <g fill="#fff" opacity=".85">
        <rect x="6" y="31" width="3" height="3" />
        <rect x="6" y="38" width="3" height="3" />
        <rect x="19" y="19" width="3" height="3" />
        <rect x="19" y="27" width="3" height="3" />
        <rect x="19" y="35" width="3" height="3" />
        <rect x="31" y="35" width="3" height="3" />
        <rect x="43" y="27" width="3" height="3" />
        <rect x="43" y="35" width="3" height="3" />
      </g>
      <rect x="0" y="52" width="56" height="4" fill="#4A4F7A" />
    </>
  ),
  family: () => (
    <>
      <rect width="56" height="56" fill="#FFE9D6" />
      <circle cx="46" cy="12" r="6" fill="#FFD27A" />
      <path d="M-4 44 Q28 36 60 44 V56 H-4Z" fill="#9ED89A" />
      <g>
        <rect x="11" y="31" width="11" height="19" rx="5.5" fill="#7563D8" />
        <circle cx="16.5" cy="25" r="5" fill="#F2C7A5" />
        <path d="M11.5 24 a5 5 0 0 1 10 0 q-5-3-10 0Z" fill="#2B2233" />
      </g>
      <g>
        <rect x="33" y="31" width="11" height="19" rx="5.5" fill="#FF9AA2" />
        <circle cx="38.5" cy="25" r="5" fill="#E3A982" />
        <path d="M33.5 25 a5 5 0 0 1 10 0 q-5-4-10 0Z" fill="#6B3F2A" />
      </g>
      <g>
        <rect x="24" y="39" width="8" height="11" rx="4" fill="#91BFFF" />
        <circle cx="28" cy="35" r="3.8" fill="#F6D2B5" />
        <path d="M24.2 34.5 a3.8 3.8 0 0 1 7.6 0 q-3.8-3-7.6 0Z" fill="#8A4B2B" />
      </g>
      <rect x="46" y="42" width="7" height="8" rx="1.5" fill={INK} />
    </>
  ),
  road: () => (
    <>
      <rect width="56" height="56" fill="#DDEBFF" />
      <circle cx="44" cy="12" r="5.5" fill="#FFE59A" />
      <path d="M-4 34 Q12 22 28 30 T60 26 V56 H-4Z" fill="#A8DDA5" />
      <path d="M13 56 L25.5 29 H30.5 L43 56Z" fill="#4B5170" />
      <g fill="#fff">
        <rect x="27.3" y="31" width="1.4" height="3" />
        <rect x="27.1" y="37" width="1.8" height="4.5" />
        <rect x="26.8" y="45" width="2.4" height="6" />
      </g>
      <g>
        <rect x="20" y="40" width="16" height="8" rx="3.5" fill="#FF9AA2" stroke={INK} strokeWidth="1.4" />
        <path d="M23 40 l2.5-4.5 h5 l2.5 4.5Z" fill="#fff" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="24.5" cy="48.5" r="2.4" fill={INK} />
        <circle cx="31.5" cy="48.5" r="2.4" fill={INK} />
      </g>
    </>
  ),
  camping: () => (
    <>
      <rect width="56" height="56" fill="#5B49BD" />
      <g fill="#fff">
        <circle cx="9" cy="9" r="1.2" />
        <circle cx="22" cy="6" r="1" />
        <circle cx="31" cy="14" r="1.2" />
        <circle cx="52" cy="22" r="1" />
      </g>
      <circle cx="46" cy="12" r="5" fill="#FFF3C4" />
      <path d="M-4 40 L12 18 L28 40Z" fill="#3A3178" />
      <path d="M20 40 L38 16 L60 40Z" fill="#46398F" />
      <path d="M-4 42 H60 V56 H-4Z" fill="#2A2560" />
      <path d="M12 52 L24 30 L36 52Z" fill="#FFB36B" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 52 L24 42 L27 52Z" fill="#7A3E1E" />
      <path d="M45 52 q-4-5 0-11 q2 3 3 3 q1-2 0-4 q5 5 1 12Z" fill="#FFD66B" />
      <path d="M46.5 52 q-2-3 0-6 q2 3 0 6Z" fill="#FF7A5A" />
    </>
  ),
  [DEFAULT_TRIP_IMAGE]: () => (
    <>
      <rect width="56" height="56" fill="#DCE9FF" />
      <circle cx="43" cy="14" r="6" fill="#FFE59A" />
      <path d="M-4 44 Q14 28 30 40 T60 36 V56 H-4Z" fill="#D9F8CB" />
      <path d="M-4 52 Q20 40 40 48 T60 46 V56 H-4Z" fill="#8ED28A" />
      <path d="M8 30 C14 26 18 30 24 24" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 4" />
      <path d="M24 24 l14-7 -4 14 -4-5 -6-2Z" fill="#fff" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M30 26 l4-7" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
}

/**
 * The trip's thumbnail, chosen from its saved image category (or inferred from its name for
 * older trips). The box keeps a fixed square size and rounded corners, so it never moves the layout.
 */
export function TripThumbnail({ trip, size = 56, className = '' }) {
  const { id } = getTripImageAsset(trip)
  const Scene = SCENES[id] ?? SCENES[DEFAULT_TRIP_IMAGE]
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
      aria-hidden="true"
      data-trip-image={id}
    >
      <svg viewBox="0 0 56 56" width={size} height={size} preserveAspectRatio="xMidYMid slice" className="block">
        <Scene />
      </svg>
    </span>
  )
}
