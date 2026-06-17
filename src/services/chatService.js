import { apiRequest } from './apiClient'

export async function fetchChatMessages(applicationId) {
  const response = await apiRequest(`/app/applications/${applicationId}/chat`)
  return Array.isArray(response.messages) ? response.messages : []
}

export async function sendChatMessage(applicationId, text) {
  const response = await apiRequest(`/app/applications/${applicationId}/chat`, {
    method: 'POST',
    body: { text },
  })

  return response.message
}
