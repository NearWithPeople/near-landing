import { getCityNameFromAddress, getCityOption } from '../constants/belarusCities'
import { haversineKm } from '../utils/common'
import { getDatabase } from './storageService'

function enrichVacancy(vacancy, userPoint, applicationCountMap) {
  const distanceKm = userPoint ? haversineKm(userPoint, { lat: vacancy.lat, lng: vacancy.lng }) : 0
  return {
    ...vacancy,
    distanceKm,
    applicationCount: applicationCountMap.get(vacancy.id) || 0,
  }
}

export function listVacancies({ userPoint, city = 'all', query = '', payMin = 0, category = 'all', shiftDate = 'all', sortBy = 'relevant' }) {
  const db = getDatabase()
  const normalizedQuery = query.trim().toLowerCase()
  const selectedCity = getCityOption(city)
  const applicationCountMap = new Map()

  ;(db.applications || []).forEach((application) => {
    applicationCountMap.set(application.vacancyId, (applicationCountMap.get(application.vacancyId) || 0) + 1)
  })

  const items = db.vacancies
    .filter((vacancy) => vacancy.status === 'open')
    .filter((vacancy) => (selectedCity.value === 'all' ? true : getCityNameFromAddress(vacancy.address) === selectedCity.label))
    .filter((vacancy) => (category === 'all' ? true : vacancy.type === category))
    .filter((vacancy) => (shiftDate === 'all' ? true : vacancy.shiftDate === shiftDate))
    .map((vacancy) => enrichVacancy(vacancy, userPoint, applicationCountMap))
    .filter((vacancy) => vacancy.payFrom >= payMin)
    .filter((vacancy) =>
      normalizedQuery
        ? `${vacancy.title} ${vacancy.companyName} ${vacancy.address} ${vacancy.type}`.toLowerCase().includes(normalizedQuery)
        : true
    )

  if (sortBy === 'distance') return items.sort((a, b) => a.distanceKm - b.distanceKm)
  if (sortBy === 'salary') return items.sort((a, b) => b.payFrom - a.payFrom)
  if (sortBy === 'date') return items.sort((a, b) => a.shiftDate.localeCompare(b.shiftDate))
  return items.sort((a, b) => b.payFrom - a.payFrom || a.distanceKm - b.distanceKm)
}

export function getVacancyById(vacancyId, userPoint) {
  const db = getDatabase()
  const vacancy = (db.vacancies || []).find((item) => item.id === vacancyId)
  if (!vacancy) return null
  const applicationCountMap = new Map()
  ;(db.applications || []).forEach((application) => {
    applicationCountMap.set(application.vacancyId, (applicationCountMap.get(application.vacancyId) || 0) + 1)
  })
  return enrichVacancy(vacancy, userPoint, applicationCountMap)
}

