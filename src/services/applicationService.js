import { getDatabase, saveDatabase } from './storageService'

export function listApplicationsForUser(userId) {
  const db = getDatabase()
  return (db.applications || [])
    .filter((application) => application.applicantId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function listApplicationsForEmployer(ownerId) {
  const db = getDatabase()
  const ownVacancyIds = new Set((db.vacancies || []).filter((vacancy) => vacancy.ownerId === ownerId).map((vacancy) => vacancy.id))
  return (db.applications || [])
    .filter((application) => ownVacancyIds.has(application.vacancyId))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function hasUserAppliedToVacancy(userId, vacancyId) {
  const db = getDatabase()
  return (db.applications || []).some((application) => application.applicantId === userId && application.vacancyId === vacancyId)
}

export function createApplication({ vacancyId, applicantId }) {
  const db = getDatabase()
  const vacancy = (db.vacancies || []).find((item) => item.id === vacancyId)
  const user = (db.users || []).find((item) => item.id === applicantId)

  if (!vacancy || !user) {
    throw new Error('Не удалось найти вакансию или пользователя.')
  }

  const existing = (db.applications || []).find((application) => application.applicantId === applicantId && application.vacancyId === vacancyId)
  if (existing) return existing

  const application = {
    id: `app_${vacancyId}_${applicantId}_${Date.now()}`,
    vacancyId: vacancy.id,
    vacancyTitle: vacancy.title,
    applicantId: user.id,
    applicantName: user.fullName,
    employerName: vacancy.companyName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  db.applications = [application, ...(db.applications || [])]
  saveDatabase(db)
  return application
}

