import { haversineKm } from '../utils/common'
import { getDatabase } from './storageService'

export function listVacancies({ userPoint, query = '', payMin = 0, category = 'all' }) {
  const db = getDatabase()
  const normalizedQuery = query.trim().toLowerCase()

  return db.vacancies
    .filter((vacancy) => vacancy.status === 'open')
    .filter((vacancy) => (category === 'all' ? true : vacancy.type === category))
    .map((vacancy) => {
      const distanceKm = haversineKm(userPoint, { lat: vacancy.lat, lng: vacancy.lng })
      return {
        ...vacancy,
        distanceKm,
      }
    })
    .filter((vacancy) => vacancy.payFrom >= payMin)
    .filter((vacancy) =>
      normalizedQuery
        ? `${vacancy.title} ${vacancy.companyName} ${vacancy.address} ${vacancy.type}`.toLowerCase().includes(normalizedQuery)
        : true
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

