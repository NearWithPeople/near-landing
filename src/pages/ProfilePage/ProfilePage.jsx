import { useEffect, useMemo, useState } from 'react'

import { isBelarusPhone, normalizePhone, splitFullName } from '../../utils/common'
import './ProfilePage.css'

function getProfileForm(currentUser) {
  const nameParts = splitFullName(currentUser.fullName)

  return {
    lastName: nameParts.lastName,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    age: currentUser.age ? String(currentUser.age) : '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    telegramUsername: currentUser.telegramUsername || '',
    review: currentUser.review || '',
  }
}

function getVacancyStatusLabel(status) {
  if (status === 'pending_review') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  if (status === 'archived') return 'В архиве'
  if (status === 'closed') return 'Закрыта'
  if (status === 'paused') return 'На паузе'
  if (status === 'draft') return 'Черновик'
  return 'Открыта'
}

function ProfileMenuIcon({ type }) {
  if (type === 'history') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3.5 12a8.5 8.5 0 1 0 2.4-5.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3 7.5V12h4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'stats') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 19V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 19v-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 19h17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'notifications') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4.5c-2.4 0-4.2 1.8-4.2 4.1v2.8l-1.3 2.2h11l-1.3-2.2V8.6C16.2 6.3 14.4 4.5 12 4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M10 17.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5V19l-5.5-3-5.5 3V6A1.5 1.5 0 0 1 8 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function ProfilePage({
  currentUser,
  completedTasks,
  employerVacancies,
  onNavigate,
  onOpenEmployerVacancy,
  onCreateVacancy,
  onLogout,
  onSaveProfile,
}) {
  const isEmployer = currentUser.role === 'employer'
  const [profileError, setProfileError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState(() => getProfileForm(currentUser))
  const [activeView, setActiveView] = useState('hub')
  const [menuOpen, setMenuOpen] = useState(false)

  const nameParts = useMemo(() => splitFullName(currentUser.fullName), [currentUser.fullName])
  const profileFacts = useMemo(
    () => [
      { label: 'Фамилия', value: profileForm.lastName || 'Не указана' },
      { label: 'Имя', value: profileForm.firstName || 'Не указано' },
      { label: 'Отчество', value: profileForm.middleName || 'Не указано' },
      { label: 'Возраст', value: profileForm.age ? `${profileForm.age} лет` : 'Не указан' },
      { label: 'Телефон', value: profileForm.phone || 'Не указан' },
      { label: 'Email', value: profileForm.email || 'Не указан' },
      { label: 'Telegram', value: profileForm.telegramUsername || 'Не указан' },
    ],
    [profileForm.age, profileForm.email, profileForm.firstName, profileForm.lastName, profileForm.middleName, profileForm.phone, profileForm.telegramUsername]
  )

  const ratingLabel = useMemo(() => {
    const employerCount = new Set(completedTasks.map((task) => task.employerName).filter(Boolean)).size
    const count = employerCount || 12
    return `4.9 от ${count} работодателей`
  }, [completedTasks])

  const menuItems = isEmployer
    ? [
        { id: 'tasks', label: 'Мои задачи', icon: 'stats' },
        { id: 'stats', label: 'Статистика', icon: 'stats' },
        { id: 'notifications', label: 'Уведомления', icon: 'notifications' },
        { id: 'data', label: 'Мои данные', icon: 'data' },
      ]
    : [
        { id: 'history', label: 'История откликов', icon: 'history' },
        { id: 'stats', label: 'Статистика', icon: 'stats' },
        { id: 'notifications', label: 'Уведомления', icon: 'notifications' },
        { id: 'data', label: 'Мои данные', icon: 'data' },
      ]

  useEffect(() => {
    setProfileForm(getProfileForm(currentUser))
    setIsEditing(false)
    setProfileError('')
    setActiveView('hub')
    setMenuOpen(false)
  }, [currentUser])

  function handleChange(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    if (profileError) setProfileError('')
  }

  async function handleSave() {
    const age = Number(profileForm.age)
    const normalizedPhone = normalizePhone(profileForm.phone)

    if (!profileForm.lastName.trim() || !profileForm.firstName.trim()) {
      setProfileError('Укажи как минимум фамилию и имя.')
      return
    }
    if (!isEmployer && (!Number.isFinite(age) || age < 16 || age > 99)) {
      setProfileError('Возраст пользователя должен быть от 16 до 99 лет.')
      return
    }
    if (normalizedPhone && !isBelarusPhone(normalizedPhone)) {
      setProfileError('Укажи телефон в белорусском формате: +375 XX XXX XX XX или 80XX XXX XX XX.')
      return
    }
    const error = await onSaveProfile(profileForm)
    if (error) {
      setProfileError(error)
      return
    }
    setIsEditing(false)
    setProfileError('')
  }

  function handleCancelEdit() {
    setProfileForm(getProfileForm(currentUser))
    setProfileError('')
    setIsEditing(false)
  }

  function handleMenuSelect(itemId) {
    if (itemId === 'history') {
      onNavigate?.('/applications')
      return
    }
    if (itemId === 'data') {
      setActiveView('data')
      return
    }
    setActiveView(itemId)
  }

  function renderPlaceholderView(title, text) {
    return (
      <section className="profilePage">
        <div className="profilePage__subHeader">
          <button type="button" className="profilePage__back" onClick={() => setActiveView('hub')} aria-label="Назад">
            ←
          </button>
          <h2 className="profilePage__subTitle">{title}</h2>
        </div>
        <article className="profilePage__panel">
          <p className="profilePage__panelText">{text}</p>
        </article>
      </section>
    )
  }

  function renderProfileData() {
    return (
      <section className="profilePage">
        <div className="profilePage__subHeader">
          <button type="button" className="profilePage__back" onClick={() => setActiveView('hub')} aria-label="Назад">
            ←
          </button>
          <h2 className="profilePage__subTitle">Мои данные</h2>
          {!isEditing ? (
            <button type="button" className="profilePage__subAction" onClick={() => setIsEditing(true)}>
              Изменить
            </button>
          ) : null}
        </div>

        <article className="profilePage__panel profileEditor">
          {!isEditing ? (
            <>
              <div className="profileSummary__grid">
                {profileFacts.map((item) => (
                  <div key={item.label} className={`profileSummary__item ${item.label === 'Email' ? 'profileSummary__item--full' : ''}`.trim()}>
                    <div className="profileSummary__label">{item.label}</div>
                    <div className="profileSummary__value">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="profileSummary__about">
                <div className="profileSummary__label">О себе</div>
                <div className="profileSummary__text">{profileForm.review || 'Пока ничего не добавлено.'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="profileEditor__grid">
                <label className="field">
                  <span className="field__label">Фамилия</span>
                  <input className="input input--dark" value={profileForm.lastName} onChange={(event) => handleChange('lastName', event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">Имя</span>
                  <input className="input input--dark" value={profileForm.firstName} onChange={(event) => handleChange('firstName', event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">Отчество</span>
                  <input className="input input--dark" value={profileForm.middleName} onChange={(event) => handleChange('middleName', event.target.value)} />
                </label>
                {!isEmployer ? (
                  <label className="field">
                    <span className="field__label">Возраст</span>
                    <input className="input input--dark" type="number" min="16" max="99" inputMode="numeric" value={profileForm.age} onChange={(event) => handleChange('age', event.target.value)} />
                  </label>
                ) : null}
                <label className="field">
                  <span className="field__label">Телефон</span>
                  <input className="input input--dark" type="tel" inputMode="tel" value={profileForm.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="+375 29 123 45 67" />
                </label>
                <label className="field profileEditor__field--full">
                  <span className="field__label">Email</span>
                  <input className="input input--dark" type="email" autoComplete="email" value={profileForm.email} onChange={(event) => handleChange('email', event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">Telegram username (необязательно)</span>
                  <input className="input input--dark" value={profileForm.telegramUsername} onChange={(event) => handleChange('telegramUsername', event.target.value)} placeholder="@username" />
                </label>
                <label className="field profileEditor__field--full">
                  <span className="field__label">Отзыв о себе</span>
                  <textarea className="input input--dark authForm__textarea" rows={4} value={profileForm.review} onChange={(event) => handleChange('review', event.target.value)} />
                </label>
              </div>
              <div className="profileEditor__actions">
                <button type="button" className="ghostButton" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button type="button" className="primaryButton" onClick={handleSave}>
                  Сохранить профиль
                </button>
              </div>
              {profileError ? <div className="formError">{profileError}</div> : null}
            </>
          )}
        </article>

        <button type="button" className="profilePage__logout" onClick={onLogout}>
          Выйти из профиля
        </button>
      </section>
    )
  }

  function renderEmployerTasks() {
    return (
      <section className="profilePage">
        <div className="profilePage__subHeader">
          <button type="button" className="profilePage__back" onClick={() => setActiveView('hub')} aria-label="Назад">
            ←
          </button>
          <h2 className="profilePage__subTitle">Мои задачи</h2>
          <button type="button" className="profilePage__subAction" onClick={onCreateVacancy}>
            Создать
          </button>
        </div>

        <div className="profilePage__stack">
          {employerVacancies.length ? (
            employerVacancies.map((vacancy) => (
              <article
                key={vacancy.id}
                className="profilePage__panel profilePage__panel--interactive"
                role="button"
                tabIndex={0}
                onClick={() => onOpenEmployerVacancy(vacancy.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpenEmployerVacancy(vacancy.id)
                  }
                }}
              >
                <h3 className="profilePage__panelTitle">{vacancy.title}</h3>
                <p className="profilePage__panelMeta">
                  {vacancy.address} • {vacancy.type}
                </p>
                <p className="profilePage__panelMeta">
                  от {vacancy.payFrom} BYN • {getVacancyStatusLabel(vacancy.status)}
                </p>
              </article>
            ))
          ) : (
            <article className="profilePage__panel">
              <p className="profilePage__panelText">Пока нет опубликованных задач.</p>
              <button type="button" className="primaryButton" onClick={onCreateVacancy}>
                Создать первую задачу
              </button>
            </article>
          )}
        </div>
      </section>
    )
  }

  if (activeView === 'data') return renderProfileData()
  if (activeView === 'tasks') return renderEmployerTasks()
  if (activeView === 'stats') {
    return renderPlaceholderView('Статистика', 'Здесь скоро появится статистика по откликам и выполненным сменам.')
  }
  if (activeView === 'notifications') {
    return renderPlaceholderView('Уведомления', 'Здесь будут уведомления о статусах откликов и новых сменах.')
  }

  const primaryName = nameParts.firstName || currentUser.fullName
  const secondaryName = nameParts.middleName || nameParts.lastName || currentUser.companyName || ''

  return (
    <section className="profilePage">
      <article className="profilePage__userCard">
        <div className="profilePage__avatar" aria-hidden="true" />

        <div className="profilePage__userInfo">
          <h2 className="profilePage__name">
            <span>{primaryName}</span>
            {secondaryName ? <span>{secondaryName}</span> : null}
          </h2>
          {!isEmployer ? <p className="profilePage__rating">★ {ratingLabel}</p> : null}
          {isEmployer ? <p className="profilePage__rating">{currentUser.companyName || 'Работодатель'}</p> : null}
        </div>

        <div className="profilePage__cardMenu">
          <button type="button" className="profilePage__menuBtn" aria-label="Меню профиля" onClick={() => setMenuOpen((prev) => !prev)}>
            ⋮
          </button>
          {menuOpen ? (
            <div className="profilePage__cardDropdown">
              <button type="button" onClick={() => { setMenuOpen(false); setActiveView('data') }}>
                Мои данные
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onLogout() }}>
                Выйти
              </button>
            </div>
          ) : null}
        </div>
      </article>

      <nav className="profilePage__menu" aria-label="Разделы профиля">
        {menuItems.map((item) => (
          <button key={item.id} type="button" className="profilePage__menuItem" onClick={() => handleMenuSelect(item.id)}>
            <span className="profilePage__menuIcon">
              <ProfileMenuIcon type={item.icon} />
            </span>
            <span className="profilePage__menuLabel">{item.label}</span>
          </button>
        ))}
      </nav>
    </section>
  )
}
