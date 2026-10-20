import { BedDouble, Car, Fuel, Receipt, ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react'

// Keyword -> icon + soft tile. Matched against the category or title, case-insensitive.
// Tiles are plain grey in the minimal monochrome look; the three names are kept so groups can be recoloured.
const LIME = 'bg-sunken text-ink'
const GREY = 'bg-sunken text-ink'
const BLUE = 'bg-sunken text-ink'

const CATEGORIES = [
  { re: /petrol|fuel|diesel|gas|cng/, icon: Fuel, tone: LIME },
  { re: /hotel|stay|room|resort|hostel|lodg|airbnb/, icon: BedDouble, tone: BLUE },
  { re: /food|lunch|dinner|breakfast|meal|snack|tea|coffee|restaurant|cafe|biryani|drink/, icon: UtensilsCrossed, tone: LIME },
  { re: /ticket|entry|pass|museum|show|ride|park/, icon: Ticket, tone: GREY },
  { re: /shop|gift|souvenir|market|mall/, icon: ShoppingBag, tone: BLUE },
  { re: /taxi|cab|uber|ola|auto|bus|train|toll|parking|metro|flight|travel/, icon: Car, tone: GREY },
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
      className={`flex shrink-0 items-center justify-center rounded-full ${tone}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={size * 0.45} strokeWidth={2} />
    </span>
  )
}
