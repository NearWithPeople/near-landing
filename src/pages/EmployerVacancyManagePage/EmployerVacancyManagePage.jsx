import { useMemo, useState } from 'react'
import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import { getCategoryEmoji, getCategoryLabel } from '../../constants/vacancyCategories'
import { formatActiveUntil } from '../../services/vacancyService'
import { buildMailtoHref, buildTelHref, buildTelegramHref } from '../../utils/contactLinks'
import '../EmployerVacancyFormPage/EmployerVacancyFormPage.css'
import './EmployerVacancyManagePage.css'

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

export function EmployerVacancyManagePage({
  vacancy,
  applications,
  onBack,
  onCreateNew,
  onArchiveVacancy,
  onShowOnMap,
  onUpdateApplicationStatus,
  onOpenChat,
  onOpenUserProfile,
}) {
  const [candidateQuery, setCandidateQuery] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [archiveSuccess, setArchiveSuccess] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)
  const [showShiftClosure, setShowShiftClosure] = useState(false)
  const [closureApplicantId, setClosureApplicantId] = useState('none')
  const [closureReview, setClosureReview] = useState('')
  const [statusError, setStatusError] = useState('')
  const [updatingApplicationId, setUpdatingApplicationId] = useState('')

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

  async function handleApplicationStatus(applicationId, status) {
    if (!onUpdateApplicationStatus) return

    setStatusError('')
    setUpdatingApplicationId(applicationId)

    const error = await onUpdateApplicationStatus(applicationId, status)

    if (error) {
      setStatusError(error)
    }

    setUpdatingApplicationId('')
  }

  if (!vacancy) {
    return (
      <section className="shiftCreatePage">
        <article className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Смена не найдена</h2>
            <p>Возможно, она была удалена или не принадлежит вашей компании.</p>
          </div>
        </article>
        <div className="shiftCreatePage__actions">
          <button type="button" className="ghostButton" onClick={onBack}>
            Назад
          </button>
          <button type="button" className="primaryButton" onClick={onCreateNew}>
            Создать смену
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="shiftCreatePage">
      <section className="shiftCreatePage__section">
        <div className="shiftCreatePage__sectionHead">
          <h2>{vacancy.title}</h2>
          <p>от {vacancy.payFrom} BYN · {getVacancyStatusLabel(vacancy.status)}</p>
        </div>

        <div className="shiftCreatePage__categoryPreview">
          <div className="shiftCreatePage__categoryPreviewEmoji">{getCategoryEmoji(vacancy.type || vacancy.category)}</div>
          <div>
            <div className="shiftCreatePage__categoryPreviewTitle">{getCategoryLabel(vacancy.type || vacancy.category)}</div>
            <div className="shiftCreatePage__categoryPreviewDesc">
              {vacancy.shiftDate} · {vacancy.schedule} · до {formatActiveUntil(vacancy.activeUntil, vacancy.activeUntilTime)}
            </div>
          </div>
        </div>

        <div className="shiftManagePage__facts">
          <span>{vacancy.address}</span>
          <span>{formatApplicationCount(applications.length)}</span>
        </div>

        <div className="shiftManagePage__actions">
          <button type="button" className="ghostButton" onClick={onBack}>
            К сменам
          </button>
          <button type="button" className="ghostButton" onClick={() => onShowOnMap(vacancy.id)}>
            На карте
          </button>
          <button type="button" className="ghostButton" onClick={handleArchive} disabled={isArchiving || vacancy.status === 'archived'}>
            {vacancy.status === 'archived' ? 'В архиве' : 'Закрыть'}
          </button>
          <button type="button" className="primaryButton" onClick={onCreateNew}>
            Новая смена
          </button>
        </div>

        {vacancy.status === 'archived' && vacancy.closureReview ? (
          <div className="vacancyClosureNote">
            <div className="vacancyClosureNote__title">Комментарий при закрытии</div>
            <div className="vacancyClosureNote__text">{vacancy.closureReview}</div>
          </div>
        ) : null}
        {vacancy.status === 'pending_review' ? <p className="shiftManagePage__hint">Смена на модерации и появится на карте после одобрения.</p> : null}
        {vacancy.moderationReason ? <div className="formError">Причина отклонения: {vacancy.moderationReason}</div> : null}
        {archiveSuccess ? <p className="shiftManagePage__hint">{archiveSuccess}</p> : null}
        {archiveError ? <div className="formError">{archiveError}</div> : null}
        {statusError ? <div className="formError">{statusError}</div> : null}
      </section>

      <section className="shiftCreatePage__section">
        <div className="shiftCreatePage__sectionHead">
          <h2>Описание</h2>
        </div>
        <div className="shiftManagePage__text">
          {(vacancy.description?.trim() ? vacancy.description.split(/\n{2,}/) : ['Описание пока не добавлено.']).map((paragraph) => (
            <p key={paragraph}>{paragraph.trim()}</p>
          ))}
        </div>
      </section>

      <section className="shiftCreatePage__section">
        <div className="shiftCreatePage__sectionHead">
          <h2>Место на карте</h2>
          <p>{vacancy.address}</p>
        </div>
        <MapboxVacancyMap
          vacancies={[vacancy]}
          selectedVacancyId={vacancy.id}
          onSelect={() => {}}
          centerPoint={{ lat: vacancy.lat, lng: vacancy.lng, zoom: 13 }}
          className="shiftCreatePage__map"
        />
      </section>

      <section className="shiftCreatePage__section">
        <div className="shiftCreatePage__sectionHead">
          <h2>Отклики</h2>
          <p>{formatApplicationCount(applications.length)}</p>
        </div>

        <label className="field">
          <span className="field__label">Поиск по кандидатам</span>
          <input
            className="input input--dark"
            value={candidateQuery}
            onChange={(event) => setCandidateQuery(event.target.value)}
            placeholder="Имя, телефон, email или Telegram"
          />
        </label>

        <div className="shiftManagePage__applicants">
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

                  <div className="vacancyApplicantCard__actions">
                    {application.status === 'pending' ? (
                      <button
                        type="button"
                        className="ghostButton"
                        disabled={updatingApplicationId === application.id}
                        onClick={() => handleApplicationStatus(application.id, 'reviewed')}
                      >
                        Просмотрен
                      </button>
                    ) : null}
                    {application.status === 'pending' || application.status === 'reviewed' ? (
                      <>
                        <button
                          type="button"
                          className="primaryButton"
                          disabled={updatingApplicationId === application.id}
                          onClick={() => handleApplicationStatus(application.id, 'approved')}
                        >
                          Одобрить
                        </button>
                        <button
                          type="button"
                          className="ghostButton"
                          disabled={updatingApplicationId === application.id}
                          onClick={() => handleApplicationStatus(application.id, 'rejected')}
                        >
                          Отклонить
                        </button>
                      </>
                    ) : null}
                    {onOpenChat ? (
                      <button type="button" className="ghostButton" onClick={() => onOpenChat(application.id)}>
                        Чат
                      </button>
                    ) : null}
                    {onOpenUserProfile ? (
                      <button type="button" className="ghostButton" onClick={() => onOpenUserProfile(application.applicantId)}>
                        Профиль
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })
          ) : applications.length ? (
            <p className="shiftManagePage__hint">По текущему поиску кандидаты не найдены.</p>
          ) : (
            <p className="shiftManagePage__hint">Пока откликов нет. После первых откликов здесь появятся кандидаты.</p>
          )}
        </div>
      </section>

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
