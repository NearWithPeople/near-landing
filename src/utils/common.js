export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function haversineKm(a, b) {
  const R = 6371
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export function formatMoneyBYN(amount) {
  const v = typeof amount === 'number' ? amount : Number(amount || 0)
  return new Intl.NumberFormat('ru-RU').format(Math.round(v)) + ' BYN'
}

export function normalizePhone(input) {
  const digits = String(input || '').replace(/\D+/g, '')
  if (!digits) return ''
  return digits.slice(0, 20)
}

export function safeParseJSON(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

