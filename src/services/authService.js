import { getDatabase, getSession, saveDatabase, saveSession, clearSession } from './storageService'

export function getCurrentUser() {
  const db = getDatabase()
  const session = getSession()
  return db.users.find((user) => user.id === session.currentUserId) || null
}

export function registerAccount(payload) {
  if (!['user', 'employer'].includes(payload.role)) {
    throw new Error('Самостоятельная регистрация доступна только для пользователя и работодателя.')
  }

  const db = getDatabase()
  const id = `${payload.role}_${Date.now()}`
  const record = {
    id,
    role: payload.role,
    fullName: payload.fullName,
    companyName: payload.companyName || '',
    phone: payload.phone,
    email: payload.email,
    onboardingCompleted: false,
    onboardingData: {},
    createdAt: new Date().toISOString(),
  }

  db.users = [record, ...db.users]

  if (payload.role === 'user') {
    db.completedTasks = [
      {
        id: `done_${id}_1`,
        userId: id,
        title: 'Сборщик заказов',
        employerName: 'MarketHub',
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        pay: 72,
        duration: '1 день',
        address: 'Минск, Каменная горка',
        summary: 'Собрал 26 заказов за смену и сдал без расхождений.',
      },
      {
        id: `done_${id}_2`,
        userId: id,
        title: 'Курьер на вечер',
        employerName: 'QuickBox',
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        pay: 65,
        duration: '1 день',
        address: 'Минск, Немига',
        summary: 'Закрыл вечернюю смену и доставил все заказы в срок.',
      },
      ...(db.completedTasks || []),
    ]
  }

  if (payload.role === 'employer') {
    db.vacancies = [
      {
        id: `vac_${id}_1`,
        title: 'Разовая смена на складе',
        companyName: payload.companyName || payload.fullName,
        ownerId: id,
        payFrom: 70,
        address: 'Минск, Кунцевщина',
        lat: 53.9062,
        lng: 27.4552,
        type: 'Склад',
        duration: '1 день',
        schedule: 'Смена 1 день',
        status: 'open',
        tags: ['разовая смена', 'быстрый выход'],
      },
      ...(db.vacancies || []),
    ]
  }

  saveDatabase(db)
  saveSession({ currentUserId: id })
  return record
}

export function completeUserOnboarding(userId, onboardingData) {
  const db = getDatabase()
  db.users = db.users.map((user) =>
    user.id === userId
      ? {
          ...user,
          onboardingCompleted: true,
          onboardingData,
        }
      : user
  )
  saveDatabase(db)
  return db.users.find((user) => user.id === userId) || null
}

export function logoutUser() {
  clearSession()
}

