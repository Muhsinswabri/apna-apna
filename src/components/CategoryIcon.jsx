import { BedDouble, Car, Fuel, Receipt, ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react'

// Keyword -> icon + pastel tile. Matched against the expense title, case-insensitive.
const CATEGORIES = [
  { re: /petrol|fuel|diesel|gas|cng/, icon: Fuel, tone: 'bg-[#FFE4D1] text-[#C25A12] dark:bg-[#4A2E1B] dark:text-[#FFB27A]' },
  { re: /hotel|stay|room|resort|hostel|lodg|airbnb/, icon: BedDouble, tone: 'bg-[#EAD8FF] text-[#7B3FD1] dark:bg-[#3E2E60] dark:text-[#CDA9FF]' },
  { re: /food|lunch|dinner|breakfast|meal|snack|tea|coffee|restaurant|cafe|biryani|drink/, icon: UtensilsCrossed, tone: 'bg-[#CFF6EA] text-[#0B8F6B] dark:bg-[#12433A] dark:text-[#5BE3BC]' },
  { re: /ticket|entry|pass|museum|show|ride|park/, icon: Ticket, tone: 'bg-[#FFD9E3] text-[#C2335F] dark:bg-[#4A1F2D] dark:text-[#FF9DB8]' },
  { re: /shop|gift|souvenir|market|mall/, icon: ShoppingBag, tone: 'bg-[#FFF2BF] text-[#9A7400] dark:bg-[#473A12] dark:text-[#F4CF55]' },
  { re: /taxi|cab|uber|ola|auto|bus|train|toll|parking|metro|flight/, icon: Car, tone: 'bg-[#D7E8FF] text-[#1668DC] dark:bg-[#183769] dark:text-[#8DBEFF]' },
]

const FALLBACK = { icon: Receipt, tone: 'bg-sunken text-mute' }

export function categoryFor(title) {
  const t = title.toLowerCase()
  return CATEGORIES.find((c) => c.re.test(t)) ?? FALLBACK
}

export function CategoryIcon({ title, size = 44 }) {
  const { icon: Icon, tone } = categoryFor(title)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl ${tone}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={size * 0.45} strokeWidth={2} />
    </span>
  )
}
