/** Build tel: href for Belarus mobile numbers stored as digits or formatted text. */
export function buildTelHref(phone) {
  let digits = String(phone || '').replace(/\D+/g, '')
  if (digits.startsWith('80')) digits = `375${digits.slice(2)}`
  if (!digits.startsWith('375') || digits.length < 12) return ''
  return `tel:+${digits}`
}

/** Telegram username without @ → https://t.me/… */
export function buildTelegramHref(username) {
  const u = String(username || '').trim().replace(/^@+/, '')
  if (!u) return ''
  return `https://t.me/${encodeURIComponent(u)}`
}

/** Minimal mailto — без лишних параметров, чтобы не ломать клиенты. */
export function buildMailtoHref(email) {
  const e = String(email || '').trim()
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return ''
  return `mailto:${e}`
}
