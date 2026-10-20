// Picks a thumbnail category for a trip from its name. The artwork itself is bundled
// SVG (see TripThumbnail), so it renders offline and never depends on a network image.

export const DEFAULT_TRIP_IMAGE = 'travel'

/**
 * Categories in priority order. `places` are named destinations and always win over
 * the general `words`, so "Goa Family Trip" reads as Goa, not as a family trip.
 */
const CATEGORIES = [
  {
    id: 'hills',
    label: 'Green hills',
    places: ['wayanad', 'coorg', 'kodagu', 'chikmagalur', 'chikkamagaluru', 'idukki', 'thekkady', 'periyar', 'agumbe', 'sakleshpur', 'kudremukh', 'lonavala', 'mahabaleshwar', 'western ghats', 'meghalaya', 'shillong', 'cherrapunji', 'kerala'],
    words: ['hill', 'hills', 'hillstation', 'greenery', 'valley', 'waterfall', 'waterfalls', 'nature', 'forest', 'jungle', 'safari', 'wildlife'],
  },
  {
    id: 'tea',
    label: 'Tea plantations',
    places: ['ooty', 'udhagamandalam', 'munnar', 'coonoor', 'kotagiri', 'valparai', 'darjeeling', 'nilgiri', 'nilgiris', 'yercaud', 'wagamon', 'vagamon'],
    words: ['tea', 'plantation', 'plantations', 'estate', 'coffee'],
  },
  {
    id: 'beach',
    label: 'Beach and sea',
    places: ['goa', 'kovalam', 'varkala', 'gokarna', 'pondicherry', 'puducherry', 'andaman', 'lakshadweep', 'maldives', 'bali', 'phuket', 'pattaya', 'kochi beach', 'alleppey', 'alappuzha', 'marari', 'murudeshwar', 'malpe', 'digha', 'puri', 'mauritius', 'krabi', 'langkawi', 'zanzibar'],
    words: ['beach', 'beaches', 'sea', 'ocean', 'island', 'islands', 'coast', 'coastal', 'seaside', 'cruise', 'surf', 'surfing', 'snorkel', 'diving', 'backwater', 'backwaters'],
  },
  {
    id: 'skyline',
    label: 'City skyline',
    places: ['dubai', 'abu dhabi', 'abudhabi', 'uae', 'sharjah', 'doha', 'qatar', 'riyadh', 'jeddah', 'saudi', 'kuwait', 'muscat', 'oman', 'bahrain', 'singapore', 'hong kong', 'hongkong', 'new york', 'nyc', 'shanghai', 'tokyo', 'kuala lumpur', 'bangkok'],
    words: ['skyline', 'skyscraper', 'skyscrapers', 'burj', 'gulf'],
  },
  {
    id: 'snow',
    label: 'Snowy mountains',
    places: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'sonamarg', 'manali', 'shimla', 'kullu', 'leh', 'ladakh', 'spiti', 'kedarnath', 'badrinath', 'auli', 'dalhousie', 'dharamshala', 'mcleodganj', 'kasol', 'himachal', 'uttarakhand', 'sikkim', 'gangtok', 'nepal', 'kathmandu', 'switzerland', 'alps', 'himalaya', 'himalayas', 'everest', 'kashmir valley'],
    words: ['snow', 'snowy', 'ski', 'skiing', 'winter', 'glacier', 'mountain', 'mountains', 'peak', 'peaks'],
  },
  {
    id: 'city',
    label: 'City',
    places: ['bangalore', 'bengaluru', 'mumbai', 'bombay', 'delhi', 'new delhi', 'chennai', 'madras', 'hyderabad', 'kolkata', 'calcutta', 'pune', 'ahmedabad', 'jaipur', 'kochi', 'cochin', 'trivandrum', 'thiruvananthapuram', 'kozhikode', 'calicut', 'thrissur', 'mysore', 'mysuru', 'mangalore', 'mangaluru', 'coimbatore', 'london', 'paris', 'istanbul'],
    words: ['city', 'cities', 'urban', 'town', 'metro', 'downtown', 'shopping', 'mall'],
  },
  {
    id: 'family',
    label: 'Family travel',
    places: [],
    words: ['family', 'families', 'parents', 'kids', 'children', 'cousins', 'relatives', 'reunion', 'grandparents', 'trip with family', 'mom', 'dad'],
  },
  {
    id: 'road',
    label: 'Road trip',
    places: [],
    words: ['road', 'roadtrip', 'drive', 'driving', 'highway', 'ride', 'riding', 'bike', 'biking', 'bikers', 'cycling', 'car', 'journey', 'longdrive', 'tour'],
  },
  {
    id: 'camping',
    label: 'Camping',
    places: [],
    words: ['camp', 'camping', 'campfire', 'tent', 'tents', 'trek', 'trekking', 'hike', 'hiking', 'bonfire', 'adventure', 'outdoor', 'outdoors', 'wild'],
  },
]

export const TRIP_IMAGE_IDS = [...CATEGORIES.map((c) => c.id), DEFAULT_TRIP_IMAGE]
export const TRIP_IMAGE_LABELS = Object.fromEntries([
  ...CATEGORIES.map((c) => [c.id, c.label]),
  [DEFAULT_TRIP_IMAGE, 'Travel'],
])

const norm = (s) =>
  ` ${String(s ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `

/** True when `term` appears in the normalised text as whole word(s). */
function has(text, term) {
  return text.includes(` ${term} `)
}

export function isTripImageId(id) {
  return typeof id === 'string' && TRIP_IMAGE_IDS.includes(id)
}

/**
 * Best category for a trip name. Destinations win over general words; ties go to the
 * earlier category. Unknown names get the default travel scene.
 */
export function getTripImageCategory(tripName) {
  const text = norm(tripName)
  if (text.trim() === '') return DEFAULT_TRIP_IMAGE
  for (const c of CATEGORIES) if (c.places.some((p) => has(text, p))) return c.id
  for (const c of CATEGORIES) if (c.words.some((w) => has(text, w))) return c.id
  return DEFAULT_TRIP_IMAGE
}

export function getDefaultTripImage() {
  return DEFAULT_TRIP_IMAGE
}

/**
 * The stored category for a trip, or one inferred from its name when the trip is older
 * than this feature or holds an unknown value. Never returns something that cannot be drawn.
 */
export function getTripImageAsset(trip) {
  const id = isTripImageId(trip?.imageCategory) ? trip.imageCategory : getTripImageCategory(trip?.name)
  return { id, label: TRIP_IMAGE_LABELS[id] }
}
