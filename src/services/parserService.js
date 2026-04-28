const AI_INGEST_BASE_URL = String(import.meta.env.VITE_AI_INGEST_URL || 'http://localhost:3011').replace(/\/+$/, '')

function buildParserUrl(path) {
  return `${AI_INGEST_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function parseVacancyMessage(payload) {
  const response = await fetch(buildParserUrl('/api/parse-message'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  const result = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(result?.error || result?.message || 'Не удалось распарсить сообщение.')
  }

  return result
}
