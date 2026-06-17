import { useState, useEffect, useRef } from 'react'
import { fetchChatMessages, sendChatMessage } from '../../services/chatService'
import './ChatPage.css'

export function ChatPage({ currentUser, applications = [], onNavigate, activeChatId, onActiveChatChange, onChatActivity }) {
  const activeAppId = activeChatId
  const setActiveAppId = onActiveChatChange
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState('')
  const messagesEndRef = useRef(null)

  const activeApp = applications.find((app) => app.id === activeAppId) || null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!activeAppId) {
      setMessages([])
      setChatError('')
      return
    }

    let cancelled = false

    async function loadMessages() {
      setIsLoading(true)
      setChatError('')

      try {
        const loaded = await fetchChatMessages(activeAppId)
        if (!cancelled) {
          setMessages(loaded)
        }
      } catch (error) {
        if (!cancelled) {
          setChatError(error.message || 'Не удалось загрузить сообщения.')
          setMessages([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [activeAppId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!activeAppId) return

    const interval = setInterval(async () => {
      try {
        const current = await fetchChatMessages(activeAppId)
        setMessages((prev) => {
          if (prev.length === current.length && prev.at(-1)?.id === current.at(-1)?.id) {
            return prev
          }
          return current
        })
      } catch {
        // Keep polling silent; explicit load already shows errors.
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [activeAppId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeAppId || isSending) return

    setIsSending(true)
    setChatError('')

    try {
      const saved = await sendChatMessage(activeAppId, inputText.trim())
      if (saved) {
        setMessages((prev) => [...prev, saved])
        setInputText('')
        onChatActivity?.()
      }
    } catch (error) {
      setChatError(error.message || 'Не удалось отправить сообщение.')
    } finally {
      setIsSending(false)
    }
  }

  const getPartnerName = (app) => {
    return currentUser.role === 'seeker'
      ? (app.employerName || 'Работодатель')
      : (app.applicantName || 'Соискатель')
  }

  const getPartnerAvatarInitials = (app) => {
    const name = getPartnerName(app)
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const formatMessageTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (applications.length === 0) {
    return (
      <div className="chatPage__emptyState">
        <div className="chatPage__emptyVisual">💬</div>
        <h2>У вас пока нет активных чатов</h2>
        <p>Откликнитесь на вакансии на карте, чтобы начать общение с работодателями.</p>
        <button className="primaryButton" onClick={() => onNavigate('/map')}>
          Найти подработку
        </button>
      </div>
    )
  }

  return (
    <div className={`chatPage ${activeAppId ? 'chatPage--hasActiveChat' : ''}`}>
      <aside className="chatPage__sidebar">
        <div className="chatPage__sidebarHeader">
          <h3>Сообщения</h3>
          <span className="chatPage__badge">{applications.length}</span>
        </div>
        <div className="chatPage__threads">
          {applications.map((app) => {
            const partnerName = getPartnerName(app)
            const initials = getPartnerAvatarInitials(app)

            return (
              <button
                key={app.id}
                className={`chatPage__threadItem ${activeAppId === app.id ? 'is-active' : ''}`}
                onClick={() => setActiveAppId(app.id)}
              >
                <div className="chatPage__avatar">{initials}</div>
                <div className="chatPage__threadInfo">
                  <div className="chatPage__threadTop">
                    <span className="chatPage__threadName">{partnerName}</span>
                  </div>
                  <span className="chatPage__threadVacancy">{app.vacancyTitle}</span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <main className="chatPage__window">
        {activeApp ? (
          <>
            <div className="chatPage__windowHeader">
              <button
                className="chatPage__backBtn"
                onClick={() => setActiveAppId('')}
                aria-label="Назад к списку чатов"
              >
                ←
              </button>
              <div className="chatPage__headerAvatar">
                {getPartnerAvatarInitials(activeApp)}
              </div>
              <div className="chatPage__headerInfo">
                <h4>{getPartnerName(activeApp)}</h4>
                <span>{activeApp.vacancyTitle}</span>
              </div>
            </div>

            <div className="chatPage__messages">
              {isLoading ? <div className="chatPage__systemMessage"><span>Загрузка сообщений...</span></div> : null}
              {chatError ? <div className="chatPage__systemMessage"><span>{chatError}</span></div> : null}
              {messages.map((msg) => {
                const isSystem = msg.senderId === 'system' || msg.senderRole === 'system'
                const isMine = msg.senderId === currentUser.id

                if (isSystem) {
                  return (
                    <div key={msg.id} className="chatPage__systemMessage">
                      <span>{msg.text}</span>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    className={`chatPage__messageBubbleWrap ${
                      isMine ? 'chatPage__messageBubbleWrap--mine' : 'chatPage__messageBubbleWrap--theirs'
                    }`}
                  >
                    <div className="chatPage__messageBubble">
                      <p className="chatPage__messageText">{msg.text}</p>
                      <span className="chatPage__messageTime">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chatPage__inputForm" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chatPage__input"
                placeholder="Сообщение..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
              />
              <button
                type="submit"
                className="chatPage__sendBtn"
                disabled={!inputText.trim() || isSending}
                aria-label="Отправить"
              >
                ➔
              </button>
            </form>
          </>
        ) : (
          <div className="chatPage__noActiveWindow">
            <div className="chatPage__windowPlaceholderIcon">💬</div>
            <p>Выберите чат для начала общения</p>
          </div>
        )}
      </main>
    </div>
  )
}
