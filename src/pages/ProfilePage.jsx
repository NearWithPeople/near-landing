import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { CONTACTS_PATH, FAQ_PATH, PRIVACY_PATH } from '../constants/legalPages'
import { ShiftRatingBlock } from '../components/ShiftRatingBlock'
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

function getVacancyStatusLabel(status) {
  if (status === 'pending_review') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  if (status === 'archived') return 'В архиве'
  if (status === 'closed') return 'Закрыта'
  if (status === 'paused') return 'На паузе'
  if (status === 'draft') return 'Черновик'
  return 'Открыта'
}

export function ProfilePage({
  currentUser,
  completedTasks,
  employerCompletedTasks = [],
  employerVacancies,
  onGoToCatalog,
  onOpenEmployerVacancy,
  onCreateVacancy,
  onLogout,
  onSaveProfile,
  onRateCompletedTask,
}) {
  const isEmployer = currentUser.role === 'employer'
  const [profileError, setProfileError] = useState('')
  const [rateError, setRateError] = useState('')
  const [ratingSubmittingId, setRatingSubmittingId] = useState('')
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
    setRateError('')
    setRatingSubmittingId('')
  }, [currentUser])

  async function handleRateTask(taskId, rating) {
    if (!onRateCompletedTask) return
    setRateError('')
    setRatingSubmittingId(taskId)
    try {
      await onRateCompletedTask(taskId, rating)
    } catch (error) {
      setRateError(error.message || 'Не удалось сохранить оценку.')
    } finally {
      setRatingSubmittingId('')
    }
  }

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

  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Профиль</div>
        </div>
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
                  <span className="field__label">Telegram username (необязательно)</span>
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
          {rateError ? <div className="formError profileRateError">{rateError}</div> : null}
          <div className="profileSummary__header profileSummary__header--flush">
            <div>
              <div className="panelHeader__title">Выполненные смены</div>
              <div className="vacancyCard__meta">Оцените работодателя по завершённой смене и посмотрите его оценку вас.</div>
            </div>
          </div>
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
                {task.workerToEmployerRating != null ? (
                  <ShiftRatingBlock label="Ваша оценка работодателю" value={task.workerToEmployerRating} />
                ) : (
                  <ShiftRatingBlock
                    label="Оцените работодателя"
                    value={null}
                    interactive
                    disabled={ratingSubmittingId === task.id}
                    onSelect={(n) => handleRateTask(task.id, n)}
                  />
                )}
                {task.employerToWorkerRating != null ? (
                  <ShiftRatingBlock label="Оценка работодателя вам" value={task.employerToWorkerRating} />
                ) : (
                  <div className="completedTaskRating__pending">Работодатель ещё не оценил эту смену</div>
                )}
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
          {rateError ? <div className="formError profileRateError">{rateError}</div> : null}
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
                  <span className="tag">{vacancy.schedule}</span>
                  <span className="tag">{getVacancyStatusLabel(vacancy.status)}</span>
                </div>
                {vacancy.moderationReason ? <div className="reviewCard__text">Причина отклонения: {vacancy.moderationReason}</div> : null}
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

          <div className="profileSummary__header profileSummary__header--flush profileSummary__header--spaced">
            <div>
              <div className="panelHeader__title">Завершённые смены</div>
              <div className="vacancyCard__meta">Оцените исполнителя и посмотрите его оценку вас.</div>
            </div>
          </div>
          {employerCompletedTasks.length ? (
            employerCompletedTasks.map((task) => (
              <article key={task.id} className="reviewCard">
                <div className="vacancyCard__title">{task.title}</div>
                <div className="vacancyCard__meta">
                  {task.workerName || 'Исполнитель'} • {task.address}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">{task.pay} BYN</span>
                  <span className="tag">{task.duration}</span>
                  <span className="tag">{new Date(task.completedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="reviewCard__text">{task.summary}</div>
                {task.employerToWorkerRating != null ? (
                  <ShiftRatingBlock label="Ваша оценка исполнителю" value={task.employerToWorkerRating} />
                ) : (
                  <ShiftRatingBlock
                    label="Оцените исполнителя"
                    value={null}
                    interactive
                    disabled={ratingSubmittingId === task.id}
                    onSelect={(n) => handleRateTask(task.id, n)}
                  />
                )}
                {task.workerToEmployerRating != null ? (
                  <ShiftRatingBlock label="Оценка исполнителя вам" value={task.workerToEmployerRating} />
                ) : (
                  <div className="completedTaskRating__pending">Исполнитель ещё не оценил эту смену</div>
                )}
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Здесь появятся завершённые смены по вашим вакансиям (после отметки смены в системе).</div>
            </article>
          )}
        </div>
      )}

      <nav className="profileLegalLinks" aria-label="Справка и документы">
        <Link to={FAQ_PATH}>FAQ</Link>
        <Link to={CONTACTS_PATH}>Контакты</Link>
        <Link to={PRIVACY_PATH}>Политика конфиденциальности</Link>
      </nav>

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

