import { useMemo, useState } from 'react'
import { MapboxVacancyMap } from '../components/MapboxVacancyMap'

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
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

function getApplicationStatusLabel(status) {
  if (status === 'approved') return 'Одобрен'
  if (status === 'reviewed') return 'Просмотрен'
  if (status === 'rejected') return 'Отклонен'
  if (status === 'cancelled') return 'Отменен'
  if (status === 'completed') return 'Завершен'
  return 'Новый'
}

export function EmployerVacancyManagePage({ vacancy, applications, onBack, onCreateNew, onArchiveVacancy, onShowOnMap }) {
  const [candidateQuery, setCandidateQuery] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [archiveSuccess, setArchiveSuccess] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)

  const filteredApplications = useMemo(() => {
    const normalizedQuery = candidateQuery.trim().toLowerCase()
    if (!normalizedQuery) return applications

    return applications.filter((application) =>
      [
        application.applicantName,
        application.applicantPhone,
        application.applicantEmail,
        application.applicantTelegram,
        application.applicantReview,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    )
  }, [applications, candidateQuery])

  async function handleArchive() {
    if (!vacancy || vacancy.status === 'archived') return

    setIsArchiving(true)
    setArchiveError('')
    setArchiveSuccess('')

    const error = await onArchiveVacancy(vacancy.id)

    if (error) {
      setArchiveError(error)
      setIsArchiving(false)
      return
    }

    setArchiveSuccess('Вакансия закрыта и перенесена в архив.')
    setIsArchiving(false)
  }

  if (!vacancy) {
    return (
      <section className="reviewsPage">
        <article className="reviewCard">
          <div className="panelHeader__title">Задача не найдена</div>
          <div className="reviewCard__text">Возможно, она была удалена или не принадлежит текущему работодателю.</div>
        </article>
        <div className="appActions mapPanel__catalogButton">
          <button className="ghostButton" onClick={onBack}>
            Назад
          </button>
          <button className="primaryButton" onClick={onCreateNew}>
            Разместить новую смену
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="vacancyDetailPage">

      <div className="vacancyDetailLayout">
        <div className="vacancyDetailMain">
          <article className="vacancyDetailCard">
            <div className="vacancyDetailCard__salary">от {vacancy.payFrom} BYN за смену</div>

            <div className="vacancyDetailFacts">
              <div className="vacancyDetailFacts__item">Компания: {vacancy.companyName}</div>
              <div className="vacancyDetailFacts__item">Статус: {getVacancyStatusLabel(vacancy.status)}</div>
              <div className="vacancyDetailFacts__item">Дата: {vacancy.shiftDate}</div>
              <div className="vacancyDetailFacts__item">Категория: {vacancy.type}</div>
              <div className="vacancyDetailFacts__item">Формат: {vacancy.schedule}</div>
              <div className="vacancyDetailFacts__item">Длительность: {vacancy.duration}</div>
              <div className="vacancyDetailFacts__item">Адрес: {vacancy.address}</div>
              {vacancy.contactPhone ? (
                <div className="vacancyDetailFacts__item">Телефон по этой смене: {vacancy.contactPhone}</div>
              ) : null}
              {vacancy.contactTelegram ? (
                <div className="vacancyDetailFacts__item">Telegram по этой смене: @{String(vacancy.contactTelegram).replace(/^@+/, '')}</div>
              ) : null}
            </div>

            <div className="vacancyDetailActions">
              <button className="ghostButton" onClick={onBack}>
                К моим задачам
              </button>
              <button className="ghostButton" onClick={handleArchive} disabled={isArchiving || vacancy.status === 'archived'}>
                {vacancy.status === 'archived' ? 'Уже в архиве' : isArchiving ? 'Переносим...' : 'Закрыть и в архив'}
              </button>
              <button className="primaryButton" onClick={onCreateNew}>
                Разместить ещё одну
              </button>
            </div>

            {vacancy.status === 'pending_review' ? <div className="vacancyApplicantCard__searchHint">Вакансия отправлена на модерацию и появится на сайте после одобрения.</div> : null}
            {vacancy.moderationReason ? <div className="formError">Причина отклонения: {vacancy.moderationReason}</div> : null}
            {archiveSuccess ? <div className="vacancyApplicantCard__searchHint">{archiveSuccess}</div> : null}
            {archiveError ? <div className="formError">{archiveError}</div> : null}
          </article>

          <article className="vacancyDetailSection">
            <div className="panelHeader__title">Описание задачи</div>
            <div className="vacancyDetailText">
              {(vacancy.description?.trim() ? vacancy.description.split(/\n{2,}/) : ['Описание пока не добавлено.']).map((paragraph) => (
                <p key={paragraph}>{paragraph.trim()}</p>
              ))}
            </div>
            {(vacancy.tags || []).length ? (
              <div className="tagRow">
                {vacancy.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>

          <article className="vacancyDetailSection">
            <div className="panelHeader__title">Место выполнения</div>
            <div className="vacancyDetailText">
              <p>{vacancy.address}</p>
            </div>
            <button className="vacancyDetailMapButton" type="button" onClick={() => onShowOnMap(vacancy.id)}>
              Открыть на большой карте
            </button>
            <div className="vacancyDetailMapCard">
              <MapboxVacancyMap
                vacancies={[vacancy]}
                selectedVacancyId={vacancy.id}
                onSelect={() => {}}
                centerPoint={{ lat: vacancy.lat, lng: vacancy.lng, zoom: 13 }}
                className="vacancyDetailMap"
              />
            </div>
          </article>
        </div>

        <aside className="vacancyDetailSidebar">
          <article className="vacancyDetailCompany">
            <div className="vacancyDetailCompany__name">Отклики кандидатов</div>
            <div className="vacancyDetailCompany__meta">Здесь отображаются все пользователи, которые откликнулись на задачу.</div>
          </article>

          <div className="vacancyDetailRelated">
            <div className="field vacancyApplicantCard__search">
              <span className="field__label">Поиск по кандидатам</span>
              <input
                className="input input--dark"
                value={candidateQuery}
                onChange={(event) => setCandidateQuery(event.target.value)}
                placeholder="Имя, телефон, email или Telegram"
              />
              <span className="field__hint">Можно быстро найти пользователя по имени или контактам.</span>
            </div>

            <div className="vacancyDetailRelated__list">
              {filteredApplications.length ? (
                filteredApplications.map((application) => (
                  <article key={application.id} className="vacancyApplicantCard">
                    <div className="vacancyCard__title">{application.applicantName}</div>
                    <div className="tagRow">
                      <span className={`tag ${application.status === 'approved' ? 'tag--accent' : ''}`}>{getApplicationStatusLabel(application.status)}</span>
                      <span className="tag">{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>

                    <div className="vacancyApplicantCard__facts">
                      {application.applicantAge ? <div className="vacancyCard__meta">Возраст: {application.applicantAge}</div> : null}
                      {application.applicantPhone ? <div className="vacancyCard__meta">Телефон: {application.applicantPhone}</div> : null}
                      {application.applicantEmail ? <div className="vacancyCard__meta">Email: {application.applicantEmail}</div> : null}
                      {application.applicantTelegram ? <div className="vacancyCard__meta">Telegram: {application.applicantTelegram}</div> : null}
                    </div>

                    <div className="reviewCard__text">{application.applicantReview || 'Кандидат пока не добавил информацию о себе.'}</div>
                  </article>
                ))
              ) : applications.length ? (
                <article className="reviewCard">
                  <div className="reviewCard__text">По текущему поиску кандидаты не найдены. Попробуй изменить имя, телефон, email или Telegram.</div>
                </article>
              ) : (
                <article className="reviewCard">
                  <div className="reviewCard__text">Пока откликов нет. После первых откликов здесь появятся кандидаты и их контакты.</div>
                </article>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
