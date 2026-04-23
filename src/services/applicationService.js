import { apiRequest } from './apiClient'

export function listApplicationsForUser(applications, userId) {
  return (applications || [])
    .filter((application) => application.applicantId === userId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function listApplicationsForEmployer(applications) {
  return (applications || [])
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function listApplicationsForVacancy(applications, _ownerId, vacancyId) {
  return (applications || [])
    .filter((application) => application.vacancyId === vacancyId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function hasUserAppliedToVacancy(applications, userId, vacancyId) {
  return (applications || []).some((application) => application.applicantId === userId && application.vacancyId === vacancyId)
}

export async function createApplication({ vacancyId }) {
  const response = await apiRequest('/app/applications', {
    method: 'POST',
    body: { vacancyId },
  })

  return response.application
}

