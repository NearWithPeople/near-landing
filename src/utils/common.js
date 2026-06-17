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

export function formatNearbyVacanciesLabel(count) {
  const value = Number(count) || 0
  if (!value) return 'нет вакансий поблизости'

  const mod10 = value % 10
  const mod100 = value % 100
  let word = 'вакансий'

  if (mod10 === 1 && mod100 !== 11) word = 'вакансия'
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = 'вакансии'

  return `${value} ${word} поблизости ›`
}

export function normalizePhone(input) {
  const digits = String(input || '').replace(/\D+/g, '')
  if (!digits) return ''
  return digits.slice(0, 20)
}

export function isBelarusPhone(input) {
  const digits = normalizePhone(input)
  if (!digits) return false
  return /^(?:375|80)(?:17|25|29|33|44)\d{7}$/.test(digits)
}

export function splitFullName(input) {
  const parts = String(input || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts.slice(2).join(' '),
  }
}

export function buildFullName({ lastName = '', firstName = '', middleName = '' }) {
  return [lastName, firstName, middleName].map((part) => String(part || '').trim()).filter(Boolean).join(' ')
}

export function safeParseJSON(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

