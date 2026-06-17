export const APPLICATION_PROGRESS_STAGES = [
  { id: 'sent', label: 'Отправлен' },
  { id: 'delivered', label: 'Доставлен' },
  { id: 'viewed', label: 'Просмотрен' },
  { id: 'confirmed', label: 'Подтверждён' },
  { id: 'shift', label: 'Смена' },
]

const STATUS_META = {
  active: {
    variant: 'active',
    label: 'Активен',
    progress: 5,
    panelTitle: 'Смена подтверждена',
    panelSubtitle: 'Не забудьте прийти вовремя на смену',
    progressDetailText: 'Работодатель подтвердил ваш отклик. Смена добавлена в активные подработки.',
  },
  pending: {
    variant: 'pending',
    label: 'Ожидает',
    progress: 1,
    panelTitle: 'Отклик отправлен',
    panelSubtitle: 'Обычно заказчик одобряет отклик в течении 4 часов',
    progressDetailText: 'Ваш отклик отправлен работодателю и ожидает просмотра.',
  },
  cancelled: {
    variant: 'cancelled',
    label: 'Отменён',
    progress: 1,
    panelTitle: 'Отклик отменён',
    panelSubtitle: '',
    progressDetailText: 'Вы отказались от этой смены или работодатель закрыл отклик.',
  },
  completed: {
    variant: 'completed',
    label: 'Выполнен',
    progress: 5,
    panelTitle: 'Смена завершена',
    panelSubtitle: '',
    progressDetailText: 'Смена выполнена. Оцените работодателя в профиле.',
  },
  new: {
    variant: 'pending',
    label: 'Ожидает',
    progress: 1,
    panelTitle: 'Отклик отправлен',
    panelSubtitle: 'Обычно заказчик одобряет отклик в течении 4 часов',
    progressDetailText: 'Ваш отклик отправлен работодателю и ожидает доставки.',
  },
  reviewed: {
    variant: 'pending',
    label: 'Ожидает',
    progress: 3,
    panelTitle: 'Отклик просмотрен',
    panelSubtitle: 'Обычно заказчик одобряет отклик в течении 4 часов',
    progressDetailText:
      'Создатель заявки просмотрел ваш отклик. Теперь в течении 3 часов ждите одобрение отклика на смену.',
  },
  approved: {
    variant: 'active',
    label: 'Активен',
    progress: 4,
    panelTitle: 'Отклик подтверждён',
    panelSubtitle: 'Скоро начнётся смена',
    progressDetailText: 'Работодатель подтвердил ваш отклик. Осталось дождаться начала смены.',
  },
  rejected: {
    variant: 'cancelled',
    label: 'Отменён',
    progress: 2,
    panelTitle: 'Отклик отклонён',
    panelSubtitle: '',
    progressDetailText: 'Работодатель отклонил ваш отклик на эту смену.',
  },
}

export function getApplicationStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending
}

export function normalizeApplication(application) {
  const meta = getApplicationStatusMeta(application.status)

  return {
    ...application,
    statusVariant: meta.variant,
    statusLabel: application.statusLabel || meta.label,
    progressFilled: application.progressFilled ?? meta.progress,
    panelTitle: application.panelTitle || meta.panelTitle,
    panelSubtitle: application.panelSubtitle ?? meta.panelSubtitle,
    progressDetailText: application.progressDetailText ?? meta.progressDetailText,
  }
}

export function getDisplayApplications(applications) {
  return applications || []
}

export function summarizeApplications(applications) {
  const normalized = applications.map(normalizeApplication)
  const activeCount = normalized.filter((item) => item.statusVariant === 'active').length
  const pendingCount = normalized.filter((item) => item.statusVariant === 'pending').length

  const parts = []
  if (activeCount) parts.push(`${activeCount} активная подработка`)
  if (pendingCount) parts.push(`${pendingCount} ожидает`)

  return {
    activeCount,
    pendingCount,
    subtitle: parts.length ? parts.join(', ') : 'Пока нет активных откликов',
  }
}

export function formatApplicationSchedule(vacancy) {
  if (!vacancy) return ''

  const date = vacancy.shiftDate ? String(vacancy.shiftDate).trim() : ''
  const schedule = vacancy.schedule ? String(vacancy.schedule).trim() : ''

  if (date && schedule) return `${date}, ${schedule}`
  return date || schedule || 'Время уточняется'
}

export function formatApplicationSalary(vacancy, application) {
  if (application?.salary) return application.salary
  if (!vacancy?.payFrom) return 'Оплата по договорённости'
  return `Оплата от ${vacancy.payFrom} Br за смену`
}
