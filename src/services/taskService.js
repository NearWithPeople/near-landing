import { apiRequest } from './apiClient'

export async function rateCompletedTask(taskId, rating) {
  return apiRequest(`/app/completed-tasks/${encodeURIComponent(taskId)}/rate`, {
    method: 'POST',
    body: { rating },
  })
}

export function listCompletedTasksForUser(completedTasks, userId) {
  return (completedTasks || [])
    .filter((task) => task.userId === userId)
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
}

export function listEmployerVacancies(vacancies, ownerId) {
  return (vacancies || [])
    .filter((vacancy) => vacancy.ownerId === ownerId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}
