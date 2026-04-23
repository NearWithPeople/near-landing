import { useEffect, useMemo, useState } from 'react'
import { isBelarusPhone, normalizePhone, splitFullName } from '../utils/common'

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

export function ProfilePage({ currentUser, completedTasks, employerVacancies, onGoToCatalog, onOpenEmployerVacancy, onCreateVacancy, onLogout, onSaveProfile }) {
  const isEmployer = currentUser.role === 'employer'
  const [profileError, setProfileError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState(() => getProfileForm(currentUser))
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

  useEffect(() => {
    setProfileForm(getProfileForm(currentUser))
    setIsEditing(false)
    setProfileError('')
  }, [currentUser])

  function handleChange(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    if (profileError) setProfileError('')
  }

  function handleSave() {
    const age = Number(profileForm.age)
    const normalizedPhone = normalizePhone(profileForm.phone)

    if (!profileForm.lastName.trim() || !profileForm.firstName.trim()) {
      setProfileError('Укажи как минимум фамилию и имя.')
      return
    }
    if (!isEmployer && (!Number.isFinite(age) || age < 16 || age > 99)) {
      setProfileError('Возраст соискателя должен быть от 16 до 99 лет.')
      return
    }
    if (normalizedPhone && !isBelarusPhone(normalizedPhone)) {
      setProfileError('Укажи телефон в белорусском формате: +375 XX XXX XX XX или 80XX XXX XX XX.')
      return
    }
    onSaveProfile(profileForm)
    setIsEditing(false)
    setProfileError('')
  }

  function handleCancelEdit() {
    setProfileForm(getProfileForm(currentUser))
    setProfileError('')
    setIsEditing(false)
  }

  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Профиль</div>
        </div>
        <div className="statusBadge">{isEmployer ? 'работодатель' : 'исполнитель'}</div>
      </div>

      {!isEmployer ? (
        <article className="reviewCard profileEditor">
          {!isEditing ? (
            <>
              <div className="profileSummary">
                <div className="profileSummary__header">
                  <div>
                    <div className="panelHeader__title">Мой профиль</div>
                    <div className="vacancyCard__meta">Здесь отображаются основные данные аккаунта.</div>
                  </div>
                  <button className="ghostButton" onClick={() => setIsEditing(true)}>
                    Редактировать
                  </button>
                </div>

                <div className="profileSummary__grid">
                  {profileFacts.map((item) => (
                    <div key={item.label} className="profileSummary__item">
                      <div className="profileSummary__label">{item.label}</div>
                      <div className="profileSummary__value">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="profileSummary__about">
                  <div className="profileSummary__label">О себе</div>
                  <div className="profileSummary__text">{profileForm.review || 'Пока ничего не добавлено.'}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panelHeader__title">Редактирование профиля</div>
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
                <label className="field">
                  <span className="field__label">Возраст</span>
                  <input className="input input--dark" type="number" min="16" max="99" inputMode="numeric" value={profileForm.age} onChange={(event) => handleChange('age', event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">Телефон</span>
                  <input className="input input--dark" type="tel" inputMode="tel" value={profileForm.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="+375 29 123 45 67" />
                </label>
                <label className="field">
                  <span className="field__label">Email</span>
                  <input className="input input--dark" value={profileForm.email} onChange={(event) => handleChange('email', event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">Telegram username</span>
                  <input className="input input--dark" value={profileForm.telegramUsername} onChange={(event) => handleChange('telegramUsername', event.target.value)} placeholder="@username" />
                </label>
                <label className="field">
                  <span className="field__label">Отзыв о себе</span>
                  <textarea className="input input--dark authForm__textarea" rows={4} value={profileForm.review} onChange={(event) => handleChange('review', event.target.value)} />
                </label>
              </div>
              <div className="profileEditor__actions">
                <button className="ghostButton" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="primaryButton" onClick={handleSave}>
                  Сохранить профиль
                </button>
              </div>
              {profileError ? <div className="formError">{profileError}</div> : null}
            </>
          )}
        </article>
      ) : null}

      {!isEmployer ? (
        <div className="reviewsGrid">
          {completedTasks.length ? (
            completedTasks.map((task) => (
              <article key={task.id} className="reviewCard">
                <div className="vacancyCard__title">{task.title}</div>
                <div className="vacancyCard__meta">
                  {task.employerName} • {task.address}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">{task.pay} BYN</span>
                  <span className="tag">{task.duration}</span>
                  <span className="tag">{new Date(task.completedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="reviewCard__text">{task.summary}</div>
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Пока нет выполненных задач. После первой смены они появятся здесь.</div>
            </article>
          )}
        </div>
      ) : (
        <div className="reviewsGrid">
          <div className="profileSummary__header">
            <div>
              <div className="panelHeader__title">Мои задачи</div>
              <div className="vacancyCard__meta">Список опубликованных смен и быстрый переход к откликам по каждой задаче.</div>
            </div>
            <button className="primaryButton" onClick={onCreateVacancy}>
              Разместить смену
            </button>
          </div>

          {employerVacancies.length ? (
            employerVacancies.map((vacancy) => (
              <article
                key={vacancy.id}
                className="reviewCard reviewCard--interactive"
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
                <div className="vacancyCard__title">{vacancy.title}</div>
                <div className="vacancyCard__meta">
                  {vacancy.address} • {vacancy.type}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">от {vacancy.payFrom} BYN</span>
                  <span className="tag">{vacancy.duration}</span>
                  <span className="tag">{vacancy.schedule}</span>
                </div>
                <button
                  type="button"
                  className="catalogPromoCard__link"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenEmployerVacancy(vacancy.id)
                  }}
                >
                  Смотреть отклики и карту
                </button>
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Пока нет опубликованных задач. Все задания здесь считаются сменами на один день.</div>
              <div className="profileEditor__actions">
                <button className="primaryButton" onClick={onCreateVacancy}>
                  Создать первую задачу
                </button>
              </div>
            </article>
          )}
        </div>
      )}

      <div className="appActions mapPanel__catalogButton">
        <button className="ghostButton" onClick={onLogout}>
          Выйти из профиля
        </button>
        <button className="primaryButton" onClick={onGoToCatalog}>
          Перейти к каталогу
        </button>
      </div>
    </section>
  )
}

