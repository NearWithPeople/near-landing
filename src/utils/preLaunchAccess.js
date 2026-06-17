export const PRELAUNCH_ACCESS_STORAGE_KEY = 'near_prelaunch_access_v1'
export const PRELAUNCH_ACCESS_ROLE_STORAGE_KEY = 'near_prelaunch_access_role_v1'
export const PRELAUNCH_ACCESS_QUERY_PARAM = 'access'

export function readPreLaunchAccess() {
  if (typeof window === 'undefined') return false
  const value = window.sessionStorage.getItem(PRELAUNCH_ACCESS_STORAGE_KEY)
  return value === '1' || value === '2'
}

export function readPreLaunchAccessRole() {
  if (typeof window === 'undefined') return 'seeker'

  const storedRole = window.sessionStorage.getItem(PRELAUNCH_ACCESS_ROLE_STORAGE_KEY)
  if (storedRole === 'employer' || storedRole === 'seeker') {
    return storedRole
  }

  const accessValue = window.sessionStorage.getItem(PRELAUNCH_ACCESS_STORAGE_KEY)
  return accessValue === '2' ? 'employer' : 'seeker'
}

export function grantPreLaunchAccess(accessValue = '1') {
  if (typeof window === 'undefined') return 'seeker'

  const normalized = String(accessValue).trim() === '2' ? '2' : '1'
  const role = normalized === '2' ? 'employer' : 'seeker'

  window.sessionStorage.setItem(PRELAUNCH_ACCESS_STORAGE_KEY, normalized)
  window.sessionStorage.setItem(PRELAUNCH_ACCESS_ROLE_STORAGE_KEY, role)

  return role
}

export function consumePreLaunchAccessFromSearch(search) {
  const params = new URLSearchParams(search)
  if (!params.has(PRELAUNCH_ACCESS_QUERY_PARAM)) return null

  const accessValue = params.get(PRELAUNCH_ACCESS_QUERY_PARAM) || '1'
  return grantPreLaunchAccess(accessValue)
}

export function stripPreLaunchAccessFromSearch(search) {
  const params = new URLSearchParams(search)
  if (!params.has(PRELAUNCH_ACCESS_QUERY_PARAM)) return search
  params.delete(PRELAUNCH_ACCESS_QUERY_PARAM)
  const next = params.toString()
  return next ? `?${next}` : ''
}

export function getDefaultAppPath({ user, accessRole = 'seeker' }) {
  if (!user) {
    return accessRole === 'employer' ? '/auth' : '/'
  }

  if (accessRole === 'employer') {
    return user.role === 'employer' ? '/map' : '/auth'
  }

  if (user.role === 'employer') {
    return '/map'
  }

  return '/map'
}
