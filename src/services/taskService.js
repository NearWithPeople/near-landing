import { getDatabase } from './storageService'

export function listCompletedTasksForUser(userId) {
  const db = getDatabase()
  return (db.completedTasks || [])
    .filter((task) => task.userId === userId)
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
}

export function listEmployerVacancies(ownerId) {
  const db = getDatabase()
  return db.vacancies
    .filter((vacancy) => vacancy.ownerId === ownerId)
    .sort((a, b) => (b.id || '').localeCompare(a.id || ''))
}

