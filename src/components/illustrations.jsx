// Original flat illustrations for Apna Apna. Rounded shapes, simple faces, black, lime and soft grey.
// Colours are fixed (not theme tokens) so the artwork looks the same in light and dark mode.
// Key names are historical: `orange` is the main black, `lav`/`mint` are pale lime, `sun` is lime.

const C = {
  ink: '#0D0D0D',
  peach: '#F1F3E8',
  cream: '#FFFFFF',
  orange: '#161616',
  deep: '#2B2B2B',
  lav: '#E9F6B0',
  lavDeep: '#C4E83A',
  sky: '#EEF1F4',
  skyDeep: '#1B1B1B',
  mint: '#DCEFA6',
  mintDeep: '#8C9086',
  sun: '#CDF246',
  pink: '#FF9AA2',
}

/** Rupee sign drawn as strokes so it never depends on font support. Centered on (0,0). */
function Rupee({ size = 1, color = C.ink, width = 2.4 }) {
  return (
    <g transform={`scale(${size})`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-5 -7 H5" />
      <path d="M-5 -2.5 H5" />
      <path d="M-5 -7 h3.2 a4.6 4.6 0 0 1 0 9.2 h-3.2 l8.5 8" />
    </g>
  )
}

/** A friendly face + shoulders. `top` is the head centre, torso runs off the bottom edge. */
function Person({ cx, top, skin, shirt, hair = C.ink, style = 'short', capColor = C.orange }) {
  return (
    <g>
      {style === 'long' && <rect x={cx - 22} y={top - 14} width="44" height="56" rx="21" fill={hair} />}
      <rect x={cx - 33} y={top + 22} width="66" height="140" rx="28" fill={shirt} />
      <circle cx={cx} cy={top} r="19" fill={skin} />
      {style === 'curly' && (
        <g fill={hair}>
          <path d={`M${cx - 19} ${top - 1} a19 19 0 0 1 38 0 Q${cx} ${top - 12} ${cx - 19} ${top - 1}Z`} />
          <circle cx={cx - 15} cy={top - 12} r="8" />
          <circle cx={cx} cy={top - 18} r="9" />
          <circle cx={cx + 15} cy={top - 12} r="8" />
          <circle cx={cx - 19} cy={top - 3} r="6" />
          <circle cx={cx + 19} cy={top - 3} r="6" />
        </g>
      )}
      {style === 'short' && (
        <path d={`M${cx - 19} ${top} a19 19 0 0 1 38 0 Q${cx + 4} ${top - 9} ${cx - 19} ${top}Z`} fill={hair} />
      )}
      {style === 'long' && (
        <path d={`M${cx - 19} ${top + 2} a19 19 0 0 1 38 0 Q${cx} ${top - 12} ${cx - 19} ${top + 2}Z`} fill={hair} />
      )}
      {style === 'cap' && (
        <g>
          <path d={`M${cx - 20} ${top - 3} a20 19 0 0 1 40 0Z`} fill={capColor} />
          <ellipse cx={cx + 15} cy={top - 3} rx="15" ry="4.5" fill={C.deep} />
        </g>
      )}
      <circle cx={cx - 6.5} cy={top + 2} r="1.9" fill={C.ink} />
      <circle cx={cx + 6.5} cy={top + 2} r="1.9" fill={C.ink} />
      <circle cx={cx - 12} cy={top + 8} r="3.2" fill={C.pink} opacity=".6" />
      <circle cx={cx + 12} cy={top + 8} r="3.2" fill={C.pink} opacity=".6" />
      <path d={`M${cx - 6.5} ${top + 8} q6.5 8 13 0 Z`} fill="#C0392B" stroke={C.ink} strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  )
}

function Arm({ x1, y1, x2, y2, color, skin }) {
  return (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={color} strokeWidth="14" strokeLinecap="round" />
      <circle cx={x2} cy={y2} r="7.5" fill={skin} />
    </g>
  )
}

/** Home hero: three friends with a suitcase, mountains and a shared receipt. */
export function FriendsHero({ className = '' }) {
  const skinA = '#F2B28C'
  const skinB = '#E7A57B'
  const skinC = '#F6C7A3'
  return (
    <svg viewBox="0 0 320 210" className={className} role="img" aria-label="Three friends travelling together" fill="none">
      <circle cx="160" cy="124" r="104" fill="#fff" opacity=".55" />
      <circle cx="268" cy="36" r="19" fill={C.sun} />
      <path d="M0 160 L72 70 L142 160Z" fill={C.sky} />
      <path d="M96 160 L180 46 L268 160Z" fill={C.lav} />
      <path d="M206 160 L272 92 L320 140 V160Z" fill={C.mint} />
      <path d="M44 30 q6-7 12 0 q6-7 12 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M78 46 q4-5 8 0 q4-5 8 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />

      {/* suitcase */}
      <g>
        <path d="M30 124 v-12 a4 4 0 0 1 4-4 h14 a4 4 0 0 1 4 4 v12" stroke={C.ink} strokeWidth="3" />
        <rect x="18" y="124" width="46" height="64" rx="9" fill={C.skyDeep} stroke={C.ink} strokeWidth="2.5" />
        <path d="M31 124 v64 M51 124 v64" stroke="#fff" strokeWidth="3" opacity=".55" />
        <circle cx="30" cy="192" r="4" fill={C.ink} />
        <circle cx="52" cy="192" r="4" fill={C.ink} />
      </g>

      {/* backpack behind the middle friend */}
      <rect x="132" y="116" width="66" height="90" rx="22" fill={C.deep} />

      <Person cx={92} top={110} skin={skinA} shirt={C.skyDeep} style="curly" />
      <Arm x1={70} y1={146} x2={52} y2={96} color={C.skyDeep} skin={skinA} />
      <path d="M43 84 l-5-9 M52 80 l0-10 M61 84 l5-9" stroke={C.skyDeep} strokeWidth="2.6" strokeLinecap="round" />

      <Person cx={236} top={110} skin={skinC} shirt={C.mintDeep} style="short" />
      <Arm x1={258} y1={146} x2={282} y2={104} color={C.mintDeep} skin={skinC} />
      <g transform="rotate(10 286 84)">
        <rect x="270" y="58" width="32" height="42" rx="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
        <g transform="translate(286 74)">
          <Rupee size={0.9} />
        </g>
        <path d="M276 90 h20 M276 95 h12" stroke={C.skyDeep} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <path d="M298 50 l4-8 M308 58 l8-4" stroke={C.mintDeep} strokeWidth="2.6" strokeLinecap="round" />

      <Person cx={164} top={98} skin={skinB} shirt={C.sun} style="cap" />
      <path d="M144 122 v40 M184 122 v40" stroke={C.deep} strokeWidth="5" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}

/** Empty-state scene: a pin over a winding road with a suitcase and a rupee coin. */
export function AdventureScene({ className = '' }) {
  return (
    <svg viewBox="0 0 240 170" className={className} role="img" aria-label="A road leading to your next adventure" fill="none">
      <circle cx="120" cy="92" r="74" fill="#fff" opacity=".6" />
      <circle cx="196" cy="34" r="16" fill={C.sun} />
      <path d="M0 126 L58 56 L112 126Z" fill={C.sky} />
      <path d="M70 126 L138 36 L214 126Z" fill={C.lav} />
      <path d="M0 126 H240 V170 H0Z" fill={C.mint} />
      <path d="M96 170 C96 150 150 150 128 128 C112 112 84 126 102 126" stroke="#fff" strokeWidth="14" strokeLinecap="round" opacity=".9" />
      <path d="M96 170 C96 150 150 150 128 128" stroke={C.peach} strokeWidth="10" strokeLinecap="round" />
      <path d="M100 166 C102 152 140 150 126 132" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />

      {/* map pin with rupee */}
      <g className="animate-float">
        <path d="M120 22 a26 26 0 0 1 26 26 c0 20-26 44-26 44 S94 68 94 48 a26 26 0 0 1 26-26Z" fill={C.orange} stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="120" cy="48" r="14" fill="#fff" stroke={C.ink} strokeWidth="2" />
        <g transform="translate(120 48)">
          <Rupee size={0.85} />
        </g>
      </g>

      {/* suitcase */}
      <g>
        <path d="M36 116 v-8 h14 v8" stroke={C.ink} strokeWidth="2.5" />
        <rect x="26" y="116" width="34" height="38" rx="7" fill={C.skyDeep} stroke={C.ink} strokeWidth="2.2" />
        <path d="M38 116 v38 M50 116 v38" stroke="#fff" strokeWidth="2.4" opacity=".55" />
      </g>
      {/* backpack */}
      <g>
        <rect x="178" y="118" width="32" height="38" rx="12" fill={C.sun} stroke={C.ink} strokeWidth="2.2" />
        <rect x="185" y="134" width="18" height="12" rx="4" fill="#fff" opacity=".6" />
      </g>
      <path d="M18 70 q4-5 8 0 q4-5 8 0" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Small header illustration for trip creation: route, pin and a paper plane. */
export function PlanIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 130 96" className={className} role="img" aria-label="Planning a trip" fill="none">
      <rect x="10" y="22" width="88" height="62" rx="16" fill={C.lav} />
      <path d="M26 66 C40 40 58 74 74 46" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 7" />
      <circle cx="26" cy="66" r="5" fill="#fff" stroke={C.ink} strokeWidth="2" />
      <g>
        <path d="M80 14 a14 14 0 0 1 14 14 c0 11-14 24-14 24 S66 39 66 28 a14 14 0 0 1 14-14Z" fill={C.orange} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="80" cy="28" r="5" fill="#fff" />
      </g>
      <path d="M96 70 l26-14 -8 28 -8-10 -10-4Z" fill="#fff" stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M106 74 l8-14" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      <circle cx="116" cy="22" r="6" fill={C.sun} />
    </svg>
  )
}

/** Empty expense list / all settled: a receipt, a coin and two happy faces. */
export function ReceiptIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 170 120" className={className} role="img" aria-label="A receipt and a coin" fill="none">
      <circle cx="85" cy="62" r="52" fill="#fff" opacity=".6" />
      <g transform="rotate(-6 78 60)">
        <path d="M50 14 h60 v84 l-7.5-6 -7.5 6 -7.5-6 -7.5 6 -7.5-6 -7.5 6 -7.5-6 -7.5 6Z" fill="#fff" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M60 36 h40 M60 48 h40 M60 60 h24" stroke={C.skyDeep} strokeWidth="3" strokeLinecap="round" />
        <path d="M60 76 h14" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
        <path d="M90 74 h10" stroke={C.orange} strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g>
        <circle cx="124" cy="78" r="22" fill={C.sun} stroke={C.ink} strokeWidth="2.4" />
        <circle cx="124" cy="78" r="15" stroke={C.deep} strokeWidth="1.6" strokeDasharray="2 4" />
        <g transform="translate(124 78)">
          <Rupee size={1.05} />
        </g>
      </g>
      <g>
        <circle cx="34" cy="86" r="14" fill={C.mint} stroke={C.ink} strokeWidth="2.2" />
        <circle cx="29.5" cy="84" r="1.6" fill={C.ink} />
        <circle cx="38.5" cy="84" r="1.6" fill={C.ink} />
        <path d="M29 90 q5 5 10 0" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <path d="M30 22 l3 6 M42 16 l0 7 M20 30 l6 2" stroke={C.orange} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/** Tiny pastel mountain tile for trip cards. `index` picks the colour pair. */
const TILE_TONES = [
  { bg: C.lav, far: '#D4E88C', near: C.lavDeep },
  { bg: C.sky, far: '#C9D0D8', near: C.skyDeep },
  { bg: C.mint, far: '#C4D69A', near: C.mintDeep },
  { bg: C.peach, far: '#DDE0CC', near: C.orange },
]

export function TripTile({ index = 0, size = 56 }) {
  const t = TILE_TONES[index % TILE_TONES.length]
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      <rect width="56" height="56" rx="18" fill={t.bg} />
      <circle cx="40" cy="17" r="6" fill={C.sun} />
      <path d="M0 46 L20 22 L36 46Z" fill={t.far} />
      <path d="M16 46 L34 26 L56 46 V50 a6 6 0 0 1 -6 6 H6 a6 6 0 0 1 -6 -6Z" fill={t.near} />
    </svg>
  )
}
