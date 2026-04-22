import { safeParseJSON } from '../utils/common'

export const DB_STORAGE_KEY = 'near_webapp_db_v2'
export const SESSION_STORAGE_KEY = 'near_webapp_session_v1'

const seededDatabase = {
  schemaVersion: 2,
  roles: ['user', 'employer', 'admin'],
  users: [
    {
      id: 'admin_1',
      role: 'admin',
      fullName: 'Системный администратор',
      companyName: '',
      age: null,
      phone: '+375291111111',
      email: 'admin@near.local',
      telegramUsername: '',
      review: 'Следит за стабильностью платформы и помогает команде быстро проверять новые сценарии.',
      onboardingCompleted: true,
      onboardingData: {},
      createdAt: '2026-04-20T10:00:00.000Z',
    },
  ],
  vacancies: [
    {
      id: 'vac_1',
      title: 'Курьер на вечер',
      companyName: 'QuickBox',
      ownerId: 'emp_seed_1',
      payFrom: 65,
      address: 'Минск, Немига',
      lat: 53.9032,
      lng: 27.5501,
      type: 'Курьер',
      duration: '1 день',
      shiftDate: 'Сегодня',
      schedule: 'Вечер',
      status: 'open',
      tags: ['сегодня', 'оплата в день'],
    },
    {
      id: 'vac_2',
      title: 'Сборщик заказов',
      companyName: 'MarketHub',
      ownerId: 'emp_seed_2',
      payFrom: 72,
      address: 'Минск, Каменная горка',
      lat: 53.9208,
      lng: 27.4492,
      type: 'Склад',
      duration: '1 день',
      shiftDate: 'Завтра',
      schedule: 'Смена 4 часа',
      status: 'open',
      tags: ['без опыта', 'обучение'],
    },
    {
      id: 'vac_3',
      title: 'Промоутер на выходные',
      companyName: 'Promo Lab',
      ownerId: 'emp_seed_3',
      payFrom: 80,
      address: 'Минск, Октябрьская',
      lat: 53.8923,
      lng: 27.5704,
      type: 'Промо',
      duration: '1 день',
      shiftDate: 'Выходные',
      schedule: 'Выходные',
      status: 'open',
      tags: ['общение', 'гибко'],
    },
    {
      id: 'vac_4',
      title: 'Помощник бариста',
      companyName: 'Coffee Room',
      ownerId: 'emp_seed_4',
      payFrom: 60,
      address: 'Минск, Пушкинская',
      lat: 53.9097,
      lng: 27.4949,
      type: 'HoReCa',
      duration: '1 день',
      shiftDate: 'Сегодня',
      schedule: 'Вечер',
      status: 'open',
      tags: ['сервис', 'подработка'],
    },
  ],
  applications: [
    {
      id: 'app_1',
      vacancyId: 'vac_1',
      vacancyTitle: 'Курьер на вечер',
      applicantId: 'user_demo_1',
      applicantName: 'Студент demo',
      employerName: 'QuickBox',
      status: 'pending',
      createdAt: '2026-04-19T12:00:00.000Z',
    },
    {
      id: 'app_2',
      vacancyId: 'vac_2',
      vacancyTitle: 'Сборщик заказов',
      applicantId: 'user_demo_1',
      applicantName: 'Студент demo',
      employerName: 'MarketHub',
      status: 'approved',
      createdAt: '2026-04-18T14:00:00.000Z',
    },
  ],
  completedTasks: [
    {
      id: 'done_1',
      userId: 'user_demo_1',
      title: 'Курьер на вечер',
      employerName: 'QuickBox',
      completedAt: '2026-04-18T18:00:00.000Z',
      pay: 65,
      duration: '1 день',
      address: 'Минск, Немига',
      summary: 'Доставил 12 заказов по району без опозданий.',
    },
    {
      id: 'done_2',
      userId: 'user_demo_1',
      title: 'Промоутер на выходные',
      employerName: 'Promo Lab',
      completedAt: '2026-04-12T15:00:00.000Z',
      pay: 80,
      duration: '1 день',
      address: 'Минск, Октябрьская',
      summary: 'Отработал смену 6 часов на промо-стойке.',
    },
  ],
  reviews: [
    {
      id: 'rev_1',
      authorName: 'Илья К.',
      authorRole: 'user',
      targetName: 'QuickBox',
      rating: 5,
      text: 'Быстро откликнулись, всё прозрачно по оплате, задача без сюрпризов.',
      createdAt: '2026-04-14T12:00:00.000Z',
    },
    {
      id: 'rev_2',
      authorName: 'Coffee Room',
      authorRole: 'employer',
      targetName: 'Исполнители платформы',
      rating: 4,
      text: 'Хороший поток кандидатов на короткие смены, удобно закрывать вечерние слоты.',
      createdAt: '2026-04-17T12:00:00.000Z',
    },
  ],
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function read(key) {
  const raw = localStorage.getItem(key)
  return raw ? safeParseJSON(raw) : null
}

export function getDatabase() {
  const data = read(DB_STORAGE_KEY)
  if (data?.schemaVersion === seededDatabase.schemaVersion) return data
  write(DB_STORAGE_KEY, seededDatabase)
  return seededDatabase
}

export function saveDatabase(db) {
  write(DB_STORAGE_KEY, db)
  return db
}

export function getSession() {
  return read(SESSION_STORAGE_KEY) || { currentUserId: null }
}

export function saveSession(session) {
  write(SESSION_STORAGE_KEY, session)
  return session
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

