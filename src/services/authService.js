import { getDatabase, getSession, saveDatabase, saveSession, clearSession } from './storageService'

export function getCurrentUser() {
  const db = getDatabase()
  const session = getSession()
  return db.users.find((user) => user.id === session.currentUserId) || null
}

export function loginAccount({ role, phone = '', email = '' }) {
  const db = getDatabase()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPhone = String(phone || '').trim()

  const user = db.users.find((item) => {
    if (item.role !== role) return false
    if (normalizedPhone && item.phone === normalizedPhone) return true
    if (normalizedEmail && String(item.email || '').trim().toLowerCase() === normalizedEmail) return true
    return false
  })

  if (!user) return null

  saveSession({ currentUserId: user.id })
  return user
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
    age: payload.role === 'user' ? payload.age : null,
    phone: payload.phone,
    email: payload.email,
    telegramUsername: payload.telegramUsername || '',
    review: payload.review || '',
    onboardingCompleted: false,
    onboardingData: {},
    createdAt: new Date().toISOString(),
  }

  db.users = [record, ...db.users]

  if (payload.role === 'user') {
    db.applications = [
      {
        id: `app_${id}_1`,
        vacancyId: 'vac_3',
        vacancyTitle: 'Промоутер на выходные',
        applicantId: id,
        applicantName: payload.fullName,
        employerName: 'Promo Lab',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
      ...(db.applications || []),
    ]
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
        shiftDate: 'Сегодня',
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

export function updateUserProfile(userId, payload) {
  const db = getDatabase()
  let updatedUser = null

  db.users = db.users.map((user) => {
    if (user.id !== userId) return user

    updatedUser = {
      ...user,
      fullName: payload.fullName ?? user.fullName,
      age: payload.age ?? user.age,
      phone: payload.phone ?? user.phone,
      email: payload.email ?? user.email,
      telegramUsername: payload.telegramUsername ?? user.telegramUsername,
      companyName: payload.companyName ?? user.companyName,
      review: payload.review ?? user.review,
    }

    return updatedUser
  })

  if (!updatedUser) {
    throw new Error('Пользователь не найден.')
  }

  db.applications = (db.applications || []).map((application) =>
    application.applicantId === userId
      ? {
          ...application,
          applicantName: updatedUser.fullName,
        }
      : application
  )

  saveDatabase(db)
  return updatedUser
}

export function logoutUser() {
  clearSession()
}

