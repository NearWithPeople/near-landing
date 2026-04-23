import { safeParseJSON } from '../utils/common'

export const AUTH_SESSION_STORAGE_KEY = 'near_auth_session_v1'

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function read(key) {
  const raw = localStorage.getItem(key)
  return raw ? safeParseJSON(raw) : null
}

export function getAuthSession() {
  return read(AUTH_SESSION_STORAGE_KEY) || { jwt: '', user: null }
}

export function saveAuthSession(session) {
  write(AUTH_SESSION_STORAGE_KEY, session)
  return session
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

