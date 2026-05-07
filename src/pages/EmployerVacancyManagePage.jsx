import { useMemo, useState } from 'react'
import { MapboxVacancyMap } from '../components/MapboxVacancyMap'
import { formatActiveUntil } from '../services/vacancyService'
import { buildMailtoHref, buildTelHref, buildTelegramHref } from '../utils/contactLinks'

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
  const [showShiftClosure, setShowShiftClosure] = useState(false)
  const [closureApplicantId, setClosureApplicantId] = useState('none')
  const [closureReview, setClosureReview] = useState('')

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

    setShowShiftClosure(true)
    setArchiveError('')
    setArchiveSuccess('')
    setClosureApplicantId('none')
    setClosureReview('')
  }

  async function confirmShiftClosure() {
    if (!vacancy || vacancy.status === 'archived') return

    setIsArchiving(true)
    setArchiveError('')
    setArchiveSuccess('')

    const shiftClosure = {
      applicationId: closureApplicantId === 'none' ? null : closureApplicantId,
      review: closureReview.trim(),
    }

    const error = await onArchiveVacancy(vacancy.id, shiftClosure)

    if (error) {
      setArchiveError(error)
      setIsArchiving(false)
      return
    }

    setShowShiftClosure(false)
    setArchiveSuccess('Смена закрыта. При выборе исполнителя у него появится запись о выполненной смене.')
    setIsArchiving(false)
  }

  function cancelShiftClosure() {
    if (isArchiving) return
    setShowShiftClosure(false)
    setArchiveError('')
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
            <div className="vacancyDetailCard__title">{vacancy.title}</div>
            <div className="vacancyDetailCard__salary">от {vacancy.payFrom} BYN за смену</div>

            <div className="vacancyDetailFacts">
              <div className="vacancyDetailFacts__item">Компания: {vacancy.companyName}</div>
              <div className="vacancyDetailFacts__item">Статус: {getVacancyStatusLabel(vacancy.status)}</div>
              <div className="vacancyDetailFacts__item">Дата: {vacancy.shiftDate}</div>
              <div className="vacancyDetailFacts__item">Активна до: {formatActiveUntil(vacancy.activeUntil)}</div>
              <div className="vacancyDetailFacts__item">Категория: {vacancy.type}</div>
              <div className="vacancyDetailFacts__item">Формат: {vacancy.schedule}</div>
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
                {vacancy.status === 'archived' ? 'Уже в архиве' : 'Закрыть и в архив'}
              </button>
              <button className="primaryButton" onClick={onCreateNew}>
                Разместить ещё одну
              </button>
            </div>

            {vacancy.status === 'archived' && vacancy.closureReview ? (
              <div className="vacancyClosureNote">
                <div className="vacancyClosureNote__title">Комментарий при закрытии</div>
                <div className="vacancyClosureNote__text">{vacancy.closureReview}</div>
              </div>
            ) : null}
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
                filteredApplications.map((application) => {
                  const phoneHref = buildTelHref(application.applicantPhone)
                  const tgHref = buildTelegramHref(application.applicantTelegram)
                  const mailHref = buildMailtoHref(application.applicantEmail)

                  return (
                    <article key={application.id} className="vacancyApplicantCard">
                      <div className="vacancyCard__title">{application.applicantName}</div>
                      <div className="tagRow">
                        <span className={`tag ${application.status === 'approved' ? 'tag--accent' : ''}`}>{getApplicationStatusLabel(application.status)}</span>
                        <span className="tag">{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>

                      <div className="vacancyApplicantCard__facts applicationContactStrip applicationContactStrip--employer">
                        {application.applicantAge ? <div className="vacancyCard__meta">Возраст: {application.applicantAge}</div> : null}
                        {application.applicantPhone ? (
                          <div className="vacancyCard__meta">
                            Телефон:{' '}
                            {phoneHref ? (
                              <a className="applicationContactStrip__link" href={phoneHref}>
                                {application.applicantPhone}
                              </a>
                            ) : (
                              application.applicantPhone
                            )}
                          </div>
                        ) : null}
                        {application.applicantEmail ? (
                          <div className="vacancyCard__meta">
                            Email:{' '}
                            {mailHref ? (
                              <a className="applicationContactStrip__link" href={mailHref}>
                                {application.applicantEmail}
                              </a>
                            ) : (
                              application.applicantEmail
                            )}
                          </div>
                        ) : null}
                        {application.applicantTelegram ? (
                          <div className="vacancyCard__meta">
                            Telegram:{' '}
                            {tgHref ? (
                              <a className="applicationContactStrip__link" href={tgHref} target="_blank" rel="noreferrer">
                                @{String(application.applicantTelegram).replace(/^@+/, '')}
                              </a>
                            ) : (
                              application.applicantTelegram
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="reviewCard__text">{application.applicantReview || 'Кандидат пока не добавил информацию о себе.'}</div>
                    </article>
                  )
                })
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

      {showShiftClosure ? (
        <div className="shiftClosureModal" role="dialog" aria-modal="true" aria-labelledby="shiftClosureTitle">
          <button type="button" className="shiftClosureModal__backdrop" aria-label="Закрыть" onClick={cancelShiftClosure} />
          <div className="shiftClosureModal__panel">
            <div className="panelHeader__title" id="shiftClosureTitle">
              Закрытие смены
            </div>
            <p className="shiftClosureModal__lead">Укажите, кто выходил на смену (если кто-то выходил), и при желании оставьте короткий отзыв. Если смены не было — выберите «Никого».</p>

            <div className="shiftClosureModal__options">
              <label className="shiftClosureModal__option">
                <input
                  type="radio"
                  name="closureApplicant"
                  value="none"
                  checked={closureApplicantId === 'none'}
                  onChange={() => setClosureApplicantId('none')}
                />
                <span>Никого / смена не состоялась</span>
              </label>
              {applications.map((application) => (
                <label key={application.id} className="shiftClosureModal__option">
                  <input
                    type="radio"
                    name="closureApplicant"
                    value={application.id}
                    checked={closureApplicantId === application.id}
                    onChange={() => setClosureApplicantId(application.id)}
                  />
                  <span>{application.applicantName || 'Кандидат'}</span>
                </label>
              ))}
            </div>

            <label className="field shiftClosureModal__field">
              <span className="field__label">Отзыв (необязательно)</span>
              <textarea
                className="input input--dark authForm__textarea"
                rows={3}
                value={closureReview}
                onChange={(event) => setClosureReview(event.target.value)}
                placeholder="Например, как прошла смена или благодарность."
              />
            </label>

            {archiveError ? <div className="formError">{archiveError}</div> : null}

            <div className="shiftClosureModal__actions">
              <button type="button" className="ghostButton" onClick={cancelShiftClosure} disabled={isArchiving}>
                Отмена
              </button>
              <button type="button" className="primaryButton" onClick={confirmShiftClosure} disabled={isArchiving}>
                {isArchiving ? 'Закрываем…' : 'Закрыть смену'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
