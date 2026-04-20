import { getDatabase } from './storageService'

export function listReviews() {
  const db = getDatabase()
  return [...db.reviews].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

