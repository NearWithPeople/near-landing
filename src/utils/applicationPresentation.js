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
    progress: 3,
    panelTitle: 'Отклик ожидает подтверждения',
    panelSubtitle: 'Обычно заказчик одобряет отклик в течении 4 часов',
    progressDetailText:
      'Создатель заявки просмотрел ваш отклик. Теперь в течении 3 часов ждите одобрение отклика на смену.',
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

export const MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    vacancyId: 'mock-center',
    vacancyTitle: 'Грузчик для переезда бренд-офиса',
    address: 'г. Минск, ул. Громова 30',
    salary: 'Оплата 45 Br за смену',
    time: 'с 08:00 по 12:00 2 июня 2026',
    status: 'active',
  },
  {
    id: 'app-2',
    vacancyId: 'mock-1',
    vacancyTitle: 'Сотрудник бригады ресторана: смена',
    address: 'г. Минск, ул. Ленина 15 (ТЦ "Galileo")',
    salary: 'Оплата от 70 Br за смену + питание',
    time: 'с 08:00 16 июня 2026 по 21:00 17 июня 2026',
    status: 'pending',
    requirements: [
      'Для работы необходима медсправка*',
      'Доступно с 14 лет с согласием законного представителя*',
    ],
    description:
      'Ночная или дневная смена (8 часов) в качестве сотрудника бригады ресторана быстрого обслуживания Mak.by Вокзальная. Приятная подработка в ведущей сети ресторанов быстрого обслуживания в Беларуси на стабильных условиях, гибким графиком и удобной локацией.',
  },
  {
    id: 'app-3',
    vacancyId: 'mock-3',
    vacancyTitle: 'Волонтер на фестивале еды в ларьке',
    status: 'cancelled',
  },
  {
    id: 'app-4',
    vacancyId: 'mock-3',
    vacancyTitle: 'Волонтер на марафоне',
    status: 'cancelled',
  },
  {
    id: 'app-5',
    vacancyId: 'mock-4',
    vacancyTitle: 'Работник зеленого строительства',
    status: 'completed',
  },
]

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
  return applications?.length ? applications : MOCK_APPLICATIONS
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
