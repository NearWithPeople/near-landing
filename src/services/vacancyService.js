import { getCityNameFromAddress, getCityOption } from '../constants/belarusCities'
import { haversineKm } from '../utils/common'
import { apiRequest } from './apiClient'

const FALLBACK_SHIFT_DATE = 'Дата уточняется'

function normalizeShiftDate(shiftDate) {
  const value = String(shiftDate || '').trim()
  return value || FALLBACK_SHIFT_DATE
}

function normalizeVacancy(vacancy) {
  return {
    ...vacancy,
    shiftDate: normalizeShiftDate(vacancy?.shiftDate),
  }
}

function enrichVacancy(vacancy, userPoint, applicationCountMap) {
  const distanceKm = userPoint ? haversineKm(userPoint, { lat: vacancy.lat, lng: vacancy.lng }) : 0
  return {
    ...normalizeVacancy(vacancy),
    distanceKm,
    applicationCount: applicationCountMap.get(vacancy.id) || vacancy.applicationCount || 0,
  }
}

function matchesCity(vacancy, selectedCity) {
  if (selectedCity.value === 'all') return true

  const normalizedVacancyCity = String(vacancy.city || '').trim().toLowerCase()
  const normalizedSelectedValue = String(selectedCity.value || '').trim().toLowerCase()
  const normalizedSelectedLabel = String(selectedCity.label || '').trim().toLowerCase()
  const cityFromAddress = getCityNameFromAddress(vacancy.address).toLowerCase()

  return normalizedVacancyCity === normalizedSelectedValue || normalizedVacancyCity === normalizedSelectedLabel || cityFromAddress === normalizedSelectedLabel
}

export function listVacancies({ vacancies = [], userPoint, city = 'all', cityOptions, query = '', payMin = 0, category = 'all', shiftDate = 'all', sortBy = 'relevant' }) {
  const normalizedQuery = query.trim().toLowerCase()
  const selectedCity = getCityOption(city, cityOptions)
  const applicationCountMap = new Map()

  const items = (vacancies || [])
    .map((vacancy) => normalizeVacancy(vacancy))
    .filter((vacancy) => vacancy.status === 'open')
    .filter((vacancy) => matchesCity(vacancy, selectedCity))
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
  if (sortBy === 'date') return items.sort((a, b) => normalizeShiftDate(a.shiftDate).localeCompare(normalizeShiftDate(b.shiftDate)))
  return items.sort((a, b) => b.payFrom - a.payFrom || a.distanceKm - b.distanceKm)
}

export function getVacancyById(vacancies, vacancyId, userPoint) {
  const vacancy = (vacancies || []).find((item) => item.id === vacancyId)
  if (!vacancy) return null
  return enrichVacancy(vacancy, userPoint, new Map())
}

export async function createVacancy(payload) {
  const response = await apiRequest('/app/vacancies', {
    method: 'POST',
    body: payload,
  })

  return response.vacancy
}

export async function archiveVacancy(vacancyId, shiftClosure) {
  const response = await apiRequest(`/app/vacancies/${vacancyId}/archive`, {
    method: 'PUT',
    body: shiftClosure ? { shiftClosure } : {},
  })

  return response.vacancy
}

