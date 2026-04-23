import { apiRequest } from './apiClient'

export async function loadAppBootstrap() {
  return apiRequest('/app/bootstrap')
}
