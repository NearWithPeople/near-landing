const CHAT_MESSAGES_KEY = 'near_chat_messages_v1'

export function getChatMessages() {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(CHAT_MESSAGES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveChatMessage(message) {
  if (typeof window === 'undefined') return
  const messages = getChatMessages()
  const newMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...message,
  }
  messages.push(newMessage)
  localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages))
  return newMessage
}

export function getInitialMessagesForApp(application) {
  return [
    {
      id: `init-1-${application.id}`,
      applicationId: application.id,
      senderId: 'system',
      senderName: 'Система',
      text: `Вы создали отклик на вакансию "${application.vacancyTitle}". Отправьте сообщение работодателю для уточнения деталей.`,
      timestamp: application.createdAt || new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: `init-2-${application.id}`,
      applicationId: application.id,
      senderId: 'employer-system',
      senderName: application.employerName || 'Работодатель',
      text: `Привет! Спасибо за отклик на вакансию "${application.vacancyTitle}". В какое время вам удобно связаться для обсуждения смены?`,
      timestamp: application.createdAt ? new Date(new Date(application.createdAt).getTime() + 60000).toISOString() : new Date(Date.now() - 3540000).toISOString(),
    }
  ]
}

export function getMessagesForApplication(applicationId, application) {
  const allMessages = getChatMessages()
  const filtered = allMessages.filter(m => m.applicationId === applicationId)
  
  if (filtered.length === 0 && application) {
    const initial = getInitialMessagesForApp(application)
    const updatedMessages = [...allMessages, ...initial]
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(updatedMessages))
    return initial
  }
  return filtered
}
