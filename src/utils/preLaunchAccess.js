export const PRELAUNCH_ACCESS_STORAGE_KEY = 'near_prelaunch_access_v1'
export const PRELAUNCH_ACCESS_QUERY_PARAM = 'access'

export function readPreLaunchAccess() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(PRELAUNCH_ACCESS_STORAGE_KEY) === '1'
}

export function grantPreLaunchAccess() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PRELAUNCH_ACCESS_STORAGE_KEY, '1')
}

export function consumePreLaunchAccessFromSearch(search) {
  const params = new URLSearchParams(search)
  if (!params.has(PRELAUNCH_ACCESS_QUERY_PARAM)) return false
  grantPreLaunchAccess()
  return true
}

export function stripPreLaunchAccessFromSearch(search) {
  const params = new URLSearchParams(search)
  if (!params.has(PRELAUNCH_ACCESS_QUERY_PARAM)) return search
  params.delete(PRELAUNCH_ACCESS_QUERY_PARAM)
  const next = params.toString()
  return next ? `?${next}` : ''
}
