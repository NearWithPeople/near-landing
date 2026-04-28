import { apiRequest } from './apiClient'

export async function loadSiteContent() {
  return apiRequest('/app/site-content', {
    headers: {
      Authorization: '',
    },
  })
}
