import { useState, useEffect, useRef } from 'react'
import { getMessagesForApplication, saveChatMessage } from '../../services/chatService'
import './ChatPage.css'

export function ChatPage({ currentUser, applications = [], onNavigate, activeChatId, onActiveChatChange }) {
  const activeAppId = activeChatId
  const setActiveAppId = onActiveChatChange
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  // Find the currently active application/chat thread
  const activeApp = applications.find((app) => app.id === activeAppId) || null

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages when the active chat thread changes
  useEffect(() => {
    if (activeAppId) {
      const loaded = getMessagesForApplication(activeAppId, activeApp)
      setMessages(loaded)
    } else {
      setMessages([])
    }
  }, [activeAppId, activeApp])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // If there's an active app, periodically check for new messages in localStorage
  useEffect(() => {
    if (!activeAppId) return

    const interval = setInterval(() => {
      const current = getMessagesForApplication(activeAppId, activeApp)
      if (current.length !== messages.length) {
        setMessages(current)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [activeAppId, messages.length, activeApp])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeAppId) return

    const isSeeker = currentUser.role === 'seeker'
    const newMessage = {
      applicationId: activeAppId,
      senderId: currentUser.id,
      senderName: isSeeker ? (currentUser.fullName || 'Соискатель') : (currentUser.companyName || 'Работодатель'),
      text: inputText.trim(),
    }

    const saved = saveChatMessage(newMessage)
    if (saved) {
      setMessages((prev) => [...prev, saved])
      setInputText('')
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
        <p>Откликнитесь на вакансии на карте или в каталоге, чтобы начать общение с работодателями.</p>
        <button className="primaryButton" onClick={() => onNavigate('/map')}>
          Найти подработку
        </button>
      </div>
    )
  }

  return (
    <div className={`chatPage ${activeAppId ? 'chatPage--hasActiveChat' : ''}`}>
      {/* Sidebar - Threads list */}
      <aside className="chatPage__sidebar">
        <div className="chatPage__sidebarHeader">
          <h3>Сообщения</h3>
          <span className="chatPage__badge">{applications.length}</span>
        </div>
        <div className="chatPage__threads">
          {applications.map((app) => {
            const partnerName = getPartnerName(app)
            const initials = getPartnerAvatarInitials(app)
            const threadMessages = getMessagesForApplication(app.id, app)
            const lastMsg = threadMessages[threadMessages.length - 1]

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
                    {lastMsg && (
                      <span className="chatPage__threadTime">
                        {formatMessageTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <span className="chatPage__threadVacancy">{app.vacancyTitle}</span>
                  <p className="chatPage__threadPreview">
                    {lastMsg ? lastMsg.text : 'Нет сообщений'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main chat window */}
      <main className="chatPage__window">
        {activeApp ? (
          <>
            {/* Window Topbar */}
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

            {/* Window Messages */}
            <div className="chatPage__messages">
              {messages.map((msg) => {
                const isSystem = msg.senderId === 'system' || msg.senderId === 'employer-system'
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

            {/* Window Input Form */}
            <form className="chatPage__inputForm" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chatPage__input"
                placeholder="Сообщение..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                className="chatPage__sendBtn"
                disabled={!inputText.trim()}
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
