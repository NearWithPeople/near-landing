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

