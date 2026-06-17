import { formatApplicationSchedule } from './applicationPresentation'

export const EMPLOYER_SHIFT_PROGRESS_STAGES = [
  { id: 'published', label: 'Опублик.' },
  { id: 'responses', label: 'Отклики' },
  { id: 'worker', label: 'Исполнитель' },
  { id: 'shift', label: 'Смена' },
  { id: 'done', label: 'Готово' },
]

const VACANCY_STATUS_META = {
  open: {
    variant: 'active',
    label: 'Активна',
    panelTitle: 'Смена на карте',
    panelSubtitle: 'Кандидаты могут откликаться на вашу смену',
    progressDetailText: 'Смена опубликована и видна соискателям на карте.',
  },
  pending_review: {
    variant: 'pending',
    label: 'Модерация',
    panelTitle: 'На модерации',
    panelSubtitle: 'Смена появится на карте после одобрения',
    progressDetailText: 'Модератор проверяет описание и условия смены.',
  },
  archived: {
    variant: 'completed',
    label: 'Завершена',
    panelTitle: 'Смена завершена',
    panelSubtitle: '',
    progressDetailText: 'Смена закрыта. Оцените исполнителя, если смена состоялась.',
  },
  rejected: {
    variant: 'cancelled',
    label: 'Отклонена',
    panelTitle: 'Смена отклонена',
    panelSubtitle: '',
    progressDetailText: 'Модератор отклонил публикацию. Исправьте замечания и создайте новую смену.',
  },
  closed: {
    variant: 'cancelled',
    label: 'Закрыта',
    panelTitle: 'Смена закрыта',
    panelSubtitle: '',
    progressDetailText: 'Смена больше не принимает отклики.',
  },
  paused: {
    variant: 'cancelled',
    label: 'На паузе',
    panelTitle: 'Смена на паузе',
    panelSubtitle: '',
    progressDetailText: 'Публикация временно приостановлена.',
  },
  draft: {
    variant: 'pending',
    label: 'Черновик',
    panelTitle: 'Черновик смены',
    panelSubtitle: '',
    progressDetailText: 'Завершите заполнение и опубликуйте смену.',
  },
}

export function getVacancyStatusMeta(status) {
  if (!status || status === 'open') return VACANCY_STATUS_META.open
  return VACANCY_STATUS_META[status] || VACANCY_STATUS_META.open
}

export function isActiveEmployerShift(vacancy) {
  const status = vacancy?.status
  return !status || status === 'open' || status === 'pending_review' || status === 'draft'
}

export function isArchivedEmployerShift(vacancy) {
  return !isActiveEmployerShift(vacancy)
}

function countApplicationsForVacancy(applications, vacancyId) {
  return (applications || []).filter((application) => application.vacancyId === vacancyId).length
}

function getProgressFilled(vacancy, applications = []) {
  const vacancyApplications = (applications || []).filter((application) => application.vacancyId === vacancy.id)
  const hasApproved = vacancyApplications.some((application) => application.status === 'approved' || application.status === 'completed')

  if (vacancy.status === 'archived') return 5
  if (vacancy.status === 'pending_review' || vacancy.status === 'draft') return 1
  if (hasApproved) return 3
  if (vacancyApplications.length) return 2
  return 1
}

export function normalizeEmployerShift(vacancy, applications = []) {
  const meta = getVacancyStatusMeta(vacancy.status)
  const applicationCount = countApplicationsForVacancy(applications, vacancy.id)

  return {
    ...vacancy,
    vacancyTitle: vacancy.title,
    salary: vacancy.payFrom ? `Оплата от ${vacancy.payFrom} Br за смену` : 'Оплата по договорённости',
    time: formatApplicationSchedule(vacancy),
    statusVariant: meta.variant,
    statusLabel: meta.label,
    progressFilled: getProgressFilled(vacancy, applications),
    panelTitle: meta.panelTitle,
    panelSubtitle: meta.panelSubtitle,
    progressDetailText: meta.progressDetailText,
    applicationCount,
  }
}

export function summarizeEmployerShifts(vacancies = [], applications = []) {
  const normalized = vacancies.map((vacancy) => normalizeEmployerShift(vacancy, applications))
  const activeCount = normalized.filter((item) => item.statusVariant === 'active').length
  const pendingCount = normalized.filter((item) => item.statusVariant === 'pending').length

  const parts = []
  if (activeCount) parts.push(`${activeCount} активная смена`)
  if (pendingCount) parts.push(`${pendingCount} на модерации`)

  return {
    activeCount,
    pendingCount,
    subtitle: parts.length ? parts.join(', ') : 'Нет активных смен',
  }
}

export function formatEmployerShiftsSubtitle(vacancies = [], applications = []) {
  return summarizeEmployerShifts(vacancies, applications).subtitle
}
