import { splitFullName } from '../utils/common'
import { apiRequest } from './apiClient'
import { clearAuthSession, getAuthSession, saveAuthSession } from './storageService'

function normalizeAccountRole(role) {
  return role === 'user' ? 'seeker' : role || 'seeker'
}

function normalizeUser(user) {
  if (!user) return null

  return {
    id: String(user.id ?? ''),
    role: normalizeAccountRole(user.role || user.accountType),
    fullName: user.fullName || '',
    companyName: user.companyName || '',
    age: user.age ?? null,
    phone: user.phone || '',
    email: user.email || '',
    telegramUsername: user.telegramUsername || '',
    review: user.review || user.about || '',
    onboardingCompleted: Boolean(user.onboardingCompleted),
    onboardingData: user.onboardingData || {},
    createdAt: user.createdAt,
  }
}

function persistSession(jwt, user) {
  const normalizedUser = normalizeUser(user)
  saveAuthSession({ jwt, user: normalizedUser })
  return normalizedUser
}

export function getCurrentUser() {
  return getAuthSession().user || null
}

export async function loginAccount({ role, phone = '', email = '', password = '' }) {
  const identifier = String(phone || email || '').trim()
  if (!identifier || !password) return null

  try {
    const payload = await apiRequest('/auth/local', {
      method: 'POST',
      body: {
        identifier,
        password,
      },
      headers: {
        Authorization: '',
      },
    })

    const user = normalizeUser(payload?.user)
    if (!user || user.role !== role) {
      clearAuthSession()
      return null
    }

    return persistSession(payload.jwt, user)
  } catch {
    return null
  }
}

export async function registerAccount(payload) {
  if (!['seeker', 'employer'].includes(payload.role)) {
    throw new Error('Самостоятельная регистрация доступна только для пользователя и работодателя.')
  }

  const nameParts = splitFullName(payload.fullName)

  const response = await apiRequest('/auth/local/register', {
    method: 'POST',
    body: {
      username: payload.phone || payload.email.trim().toLowerCase(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      accountType: payload.role,
      fullName: payload.fullName,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      middleName: nameParts.middleName,
      companyName: payload.companyName || '',
      phone: payload.phone,
      age: payload.role === 'seeker' ? payload.age : null,
      telegramUsername: payload.telegramUsername || '',
      about: payload.review || '',
      onboardingCompleted: false,
      onboardingData: {},
    },
    headers: {
      Authorization: '',
    },
  })

  return persistSession(response.jwt, response.user)
}

export async function updateUserProfile(_userId, payload) {
  const response = await apiRequest('/app/profile', {
    method: 'PUT',
    body: payload,
  })

  return persistSession(getAuthSession().jwt, response.user)
}

export function logoutUser() {
  clearAuthSession()
}

