import { useState } from 'react'
import { splitFullName } from '../utils/common'

export function ProfilePage({ currentUser, completedTasks, employerVacancies, onGoToCatalog, onLogout, onSaveProfile }) {
  const isEmployer = currentUser.role === 'employer'
  const [profileError, setProfileError] = useState('')
  const nameParts = splitFullName(currentUser.fullName)
  const [profileForm, setProfileForm] = useState({
    lastName: nameParts.lastName,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    age: currentUser.age ? String(currentUser.age) : '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    telegramUsername: currentUser.telegramUsername || '',
    review: currentUser.review || '',
  })

  function handleChange(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    if (profileError) setProfileError('')
  }

  function handleSave() {
    const age = Number(profileForm.age)
    if (!profileForm.lastName.trim() || !profileForm.firstName.trim()) {
      setProfileError('Укажи как минимум фамилию и имя.')
      return
    }
    if (!isEmployer && (!Number.isFinite(age) || age < 16)) {
      setProfileError('Возраст соискателя должен быть не меньше 16 лет.')
      return
    }
    onSaveProfile(profileForm)
    setProfileError('')
  }

  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Профиль</div>
          <div className="panelHeader__title">{currentUser.companyName || currentUser.fullName}</div>
        </div>
        <div className="statusBadge">{isEmployer ? 'работодатель' : 'исполнитель'}</div>
      </div>

      {!isEmployer ? (
        <article className="reviewCard profileEditor">
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
              <input className="input input--dark" type="number" min="16" inputMode="numeric" value={profileForm.age} onChange={(event) => handleChange('age', event.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Телефон</span>
              <input className="input input--dark" value={profileForm.phone} onChange={(event) => handleChange('phone', event.target.value)} />
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
            <button className="primaryButton" onClick={handleSave}>
              Сохранить профиль
            </button>
          </div>
          {profileError ? <div className="formError">{profileError}</div> : null}
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
          {employerVacancies.length ? (
            employerVacancies.map((vacancy) => (
              <article key={vacancy.id} className="reviewCard">
                <div className="vacancyCard__title">{vacancy.title}</div>
                <div className="vacancyCard__meta">
                  {vacancy.address} • {vacancy.type}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">от {vacancy.payFrom} BYN</span>
                  <span className="tag">{vacancy.duration}</span>
                  <span className="tag">{vacancy.schedule}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Пока нет опубликованных задач. Все задания здесь считаются сменами на один день.</div>
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

