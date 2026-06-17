function average(values) {
  if (!values.length) return null
  const sum = values.reduce((acc, value) => acc + value, 0)
  return Math.round((sum / values.length) * 10) / 10
}

export function getEmployerVacancyIds(vacancies, ownerId) {
  return new Set(
    (vacancies || [])
      .filter((vacancy) => String(vacancy.ownerId) === String(ownerId))
      .map((vacancy) => String(vacancy.id))
  )
}

export function getEmployerRatingSummary({ completedTasks = [], vacancies = [], ownerId, employerName = '' }) {
  const vacancyIds = getEmployerVacancyIds(vacancies, ownerId)
  const relevant = (completedTasks || []).filter((task) => {
    const matchesVacancy = vacancyIds.has(String(task.vacancyId))
    const matchesName = employerName && String(task.employerName || '').trim() === String(employerName).trim()
    return matchesVacancy || matchesName
  })

  const ratings = relevant
    .map((task) => Number(task.workerToEmployerRating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5)

  return {
    rating: average(ratings),
    count: ratings.length,
    reviews: relevant
      .filter((task) => task.summary || task.workerToEmployerRating != null)
      .map((task) => ({
        id: String(task.id),
        rating: task.workerToEmployerRating ?? null,
        text: task.summary || 'Смена выполнена без комментария.',
        authorName: task.workerName || 'Исполнитель',
        completedAt: task.completedAt,
        vacancyTitle: task.title,
      })),
  }
}

export function getSeekerRatingSummary({ completedTasks = [], userId }) {
  const relevant = (completedTasks || []).filter((task) => String(task.userId) === String(userId))
  const ratings = relevant
    .map((task) => Number(task.employerToWorkerRating))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5)

  return {
    rating: average(ratings),
    count: ratings.length,
    reviews: relevant
      .filter((task) => task.summary || task.employerToWorkerRating != null)
      .map((task) => ({
        id: String(task.id),
        rating: task.employerToWorkerRating ?? null,
        text: task.summary || 'Смена выполнена.',
        authorName: task.employerName || 'Работодатель',
        completedAt: task.completedAt,
        vacancyTitle: task.title,
      })),
  }
}

export function formatRatingLabel(rating, count, fallback = 'Пока нет оценок') {
  if (!rating || !count) return fallback
  return `★ ${rating.toFixed(1)} · ${count} ${count === 1 ? 'оценка' : count < 5 ? 'оценки' : 'оценок'}`
}
