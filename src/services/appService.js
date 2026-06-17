import { apiRequest } from './apiClient'
import { normalizeVacancyCategory } from '../constants/vacancyCategories'

function unwrapEntity(entity) {
  if (!entity || typeof entity !== 'object') return null

  if (entity.attributes && typeof entity.attributes === 'object') {
    return {
      id: entity.id ?? entity.documentId,
      documentId: entity.documentId,
      ...entity.attributes,
    }
  }

  return entity
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? '').trim()).filter(Boolean)
}

export function normalizeVacancyFromApi(vacancy) {
  const raw = unwrapEntity(vacancy)
  if (!raw) return null

  const requirements = normalizeStringList(raw.requirements)
  const tags = normalizeStringList(raw.tags)
  const lat = Number(raw.lat)
  const lng = Number(raw.lng)
  const payFrom = Number(raw.payFrom ?? raw.pay_from ?? 0)
  const type = normalizeVacancyCategory(raw.type || raw.category)
  const category = type

  return {
    id: String(raw.id ?? raw.documentId ?? ''),
    ownerId: String(raw.ownerId ?? raw.owner?.id ?? raw.owner ?? ''),
    title: String(raw.title || '').trim(),
    companyName: String(raw.companyName || raw.company_name || '').trim(),
    description: String(raw.description || '').trim(),
    payFrom: Number.isFinite(payFrom) ? payFrom : 0,
    address: String(raw.address || '').trim(),
    city: String(raw.city || '').trim(),
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    type,
    category,
    shiftDate: String(raw.shiftDate || raw.shift_date || '').trim(),
    activeUntil: String(raw.activeUntil || raw.active_until || '').trim(),
    activeUntilTime: String(raw.activeUntilTime || raw.active_until_time || '').trim(),
    schedule: String(raw.schedule || '').trim(),
    status: String(raw.status || 'open').trim(),
    tags,
    requirements,
    applicationCount: Number(raw.applicationCount ?? raw.application_count ?? 0) || 0,
    contactPhone: raw.contactPhone || raw.contact_phone || '',
    contactTelegram: raw.contactTelegram || raw.contact_telegram || '',
  }
}

export function normalizeVacanciesFromApi(vacancies) {
  if (!Array.isArray(vacancies)) return []

  return vacancies.map(normalizeVacancyFromApi).filter((vacancy) => vacancy?.id)
}

export function normalizeAppBootstrap(payload) {
  if (!payload || typeof payload !== 'object') return null

  return {
    currentUser: payload.currentUser || null,
    filters: payload.filters || null,
    vacancies: normalizeVacanciesFromApi(payload.vacancies),
    applications: Array.isArray(payload.applications) ? payload.applications : [],
    completedTasks: Array.isArray(payload.completedTasks) ? payload.completedTasks : [],
    employerCompletedTasks: Array.isArray(payload.employerCompletedTasks) ? payload.employerCompletedTasks : [],
    employerVacancies: normalizeVacanciesFromApi(payload.employerVacancies),
  }
}

export async function loadAppBootstrap() {
  const payload = await apiRequest('/app/bootstrap')
  return normalizeAppBootstrap(payload)
}
