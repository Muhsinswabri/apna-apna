// Illustrated member avatars. Each member keeps one avatarId (stored with the member)
// chosen from their stable id, so the same person looks the same on every screen,
// even if they are renamed. The art is drawn by MemberAvatar from these descriptions.

/** @type {{id: string, bg: string, skin: string, hair: string, shirt: string, style: string, glasses?: boolean}[]} */
export const AVATARS = [
  { id: 'av-01', bg: '#DDE8FF', skin: '#F2C7A5', hair: '#2B2233', shirt: '#7563D8', style: 'short' },
  { id: 'av-02', bg: '#D9F8CB', skin: '#C98D63', hair: '#1F1A2B', shirt: '#171A35', style: 'curly' },
  { id: 'av-03', bg: '#FFE0E6', skin: '#F6D2B5', hair: '#6B3F2A', shirt: '#91BFFF', style: 'long' },
  { id: 'av-04', bg: '#E6DFFF', skin: '#8D5A3B', hair: '#17141F', shirt: '#D9F8CB', style: 'beard' },
  { id: 'av-05', bg: '#FFF1CC', skin: '#E3A982', hair: '#2B2233', shirt: '#FF9AA2', style: 'bun' },
  { id: 'av-06', bg: '#D9F1E8', skin: '#F2C7A5', hair: '#C78B3E', shirt: '#5B49BD', style: 'bob' },
  { id: 'av-07', bg: '#FFE3D6', skin: '#A8704A', hair: '#17141F', shirt: '#7563D8', style: 'cap' },
  { id: 'av-08', bg: '#DDE8FF', skin: '#F6D2B5', hair: '#8A4B2B', shirt: '#8ED28A', style: 'spiky', glasses: true },
  { id: 'av-09', bg: '#EBFBE4', skin: '#E3A982', hair: '#7563D8', shirt: '#171A35', style: 'hijab' },
  { id: 'av-10', bg: '#E6DFFF', skin: '#C98D63', hair: '#2B2233', shirt: '#FF9AA2', style: 'long' },
  { id: 'av-11', bg: '#FFE0E6', skin: '#F2C7A5', hair: '#17141F', shirt: '#91BFFF', style: 'bald', glasses: true },
  { id: 'av-12', bg: '#D9F8CB', skin: '#8D5A3B', hair: '#17141F', shirt: '#E6DFFF', style: 'curly' },
]

const IDS = AVATARS.map((a) => a.id)

export function isAvatarId(id) {
  return typeof id === 'string' && IDS.includes(id)
}

/** Small stable string hash (FNV-1a). */
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Choose an avatar for a member id. Starts at a spot derived from the id and walks
 * on to the first one nobody in `used` has, so people on one trip look different
 * until all twelve are taken. The same id and the same `used` always give the same answer.
 */
export function pickAvatarId(memberId, used = new Set()) {
  const start = hash(String(memberId)) % IDS.length
  for (let i = 0; i < IDS.length; i++) {
    const candidate = IDS[(start + i) % IDS.length]
    if (!used.has(candidate)) return candidate
  }
  return IDS[start]
}

export function getDefaultMemberAvatar() {
  return AVATARS[0]
}

/**
 * The artwork description for a member, or null when they have none that we can draw.
 * The caller then shows a pastel initials avatar instead.
 */
export function getMemberAvatar(member) {
  return AVATARS.find((a) => a.id === member?.avatarId) ?? null
}
