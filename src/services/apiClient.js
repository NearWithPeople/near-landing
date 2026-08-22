import { clearAuthSession, getAuthSession } from './storageService'

const PROD_STRAPI_ORIGIN = 'https://romantic-apparel-51b7e4a8ea.strapiapp.com'

function getDefaultApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim()
  if (configured) return configured.replace(/\/+$/, '')

  return `${PROD_STRAPI_ORIGIN}/api`
}

const API_BASE_URL = getDefaultApiBaseUrl()

function buildUrl(path) {
  if (String(path).startsWith('http')) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiRequest(path, options = {}) {
  const session = getAuthSession()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Authorization') && session?.jwt) {
    headers.set('Authorization', `Bearer ${session.jwt}`)
  }

  let response
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body:
        options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body,
    })
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте, что near-strapi запущен и VITE_API_URL указывает на http://localhost:1337/api.')
  }

  if (response.status === 401) {
    clearAuthSession()
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || 'Не удалось выполнить запрос к серверу.'
    throw new Error(message)
  }

  return payload
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
