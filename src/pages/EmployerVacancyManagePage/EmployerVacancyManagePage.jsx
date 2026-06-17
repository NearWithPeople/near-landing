import { useMemo, useState } from 'react'

import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import { ShiftRatingBlock } from '../../components/ShiftRatingBlock'
import { getCategoryEmoji, getCategoryLabel } from '../../constants/vacancyCategories'
import { formatActiveUntil } from '../../services/vacancyService'
import { getApplicationStatusMeta, normalizeApplication } from '../../utils/applicationPresentation'
import { EMPLOYER_SHIFT_PROGRESS_STAGES, normalizeEmployerShift } from '../../utils/employerShiftPresentation'
import { buildMailtoHref, buildTelHref, buildTelegramHref } from '../../utils/contactLinks'
import '../ApplicationDetailPage/ApplicationDetailPage.css'
import '../ApplicationsPage/ApplicationsPage.css'
import './EmployerVacancyManagePage.css'

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
}

export function EmployerVacancyManagePage({
  vacancy,
  applications,
  employerCompletedTasks = [],
  onBack,
  onCreateNew,
  onArchiveVacancy,
  onShowOnMap,
  onUpdateApplicationStatus,
  onOpenChat,
  onOpenUserProfile,
  onRateCompletedTask,
}) {
  const [candidateQuery, setCandidateQuery] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [archiveSuccess, setArchiveSuccess] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)
  const [showShiftClosure, setShowShiftClosure] = useState(false)
  const [closureApplicantId, setClosureApplicantId] = useState('none')
  const [closureReview, setClosureReview] = useState('')
  const [closureRating, setClosureRating] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [updatingApplicationId, setUpdatingApplicationId] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [isRating, setIsRating] = useState(false)

  const shift = useMemo(() => (vacancy ? normalizeEmployerShift(vacancy, applications) : null), [applications, vacancy])

  const completedTask = useMemo(
    () => (vacancy ? employerCompletedTasks.find((task) => task.vacancyId === vacancy.id) || null : null),
    [employerCompletedTasks, vacancy]
  )

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

  const showShiftActions = vacancy && vacancy.status !== 'archived' && vacancy.status !== 'rejected'
  const description =
    vacancy?.description?.trim() || 'Подробности смены появятся, когда вы заполните описание вакансии.'

  async function handleArchive() {
    if (!vacancy || vacancy.status === 'archived') return

    setShowShiftClosure(true)
    setArchiveError('')
    setArchiveSuccess('')
    setClosureApplicantId('none')
    setClosureReview('')
    setClosureRating(null)
  }

  async function confirmShiftClosure() {
    if (!vacancy || vacancy.status === 'archived') return

    if (closureApplicantId !== 'none' && closureRating == null) {
      setArchiveError('Поставьте оценку исполнителю от 1 до 5 звёзд.')
      return
    }

    setIsArchiving(true)
    setArchiveError('')
    setArchiveSuccess('')

    const shiftClosure = {
      applicationId: closureApplicantId === 'none' ? null : closureApplicantId,
      review: closureReview.trim(),
    }

    const result = await onArchiveVacancy(vacancy.id, shiftClosure)

    if (result?.error) {
      setArchiveError(result.error)
      setIsArchiving(false)
      return
    }

    if (result?.completedTask?.id && closureRating != null && onRateCompletedTask) {
      try {
        await onRateCompletedTask(result.completedTask.id, closureRating)
      } catch (error) {
        setArchiveError(error.message || 'Смена закрыта, но не удалось сохранить оценку.')
        setIsArchiving(false)
        return
      }
    }

    setShowShiftClosure(false)
    setArchiveSuccess(
      closureApplicantId === 'none'
        ? 'Смена закрыта без исполнителя.'
        : 'Смена завершена. Исполнителю добавлена запись о выполненной смене.'
    )
    setIsArchiving(false)
    onBack?.()
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

  async function handleRateWorker(rating) {
    if (!completedTask?.id || !onRateCompletedTask) return

    setRatingError('')
    setIsRating(true)

    try {
      await onRateCompletedTask(completedTask.id, rating)
    } catch (error) {
      setRatingError(error.message || 'Не удалось сохранить оценку.')
    }

    setIsRating(false)
  }

  if (!vacancy || !shift) {
    return (
      <section className="applicationDetailPage">
        <div className="applicationDetailPage__empty">
          <p>Смена не найдена</p>
          <button type="button" className="applicationDetailPage__ghostBtn" onClick={onBack}>
            Назад к сменам
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="applicationDetailPage employerShiftDetailPage">
      <div className="applicationDetailPage__topbar">
        <button type="button" className="applicationDetailPage__back" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h1 className="applicationDetailPage__topTitle">Детали смены</h1>
        <div className={`applicationDetailPage__statusBadge applicationDetailPage__statusBadge--${shift.statusVariant}`}>
          <span className="applicationDetailPage__statusDot" aria-hidden="true" />
          <span>{shift.statusLabel}</span>
        </div>
      </div>

      <div className="applicationDetailPage__scroll">
        <article className="applicationDetailPage__card">
          <div className="applicationDetailPage__cardHead">
            <h2 className="applicationDetailPage__title">{shift.vacancyTitle}</h2>
            <button type="button" className="applicationDetailPage__iconBtn" onClick={() => onShowOnMap?.(vacancy.id)}>
              🗺
            </button>
          </div>

          <div className="employerShiftDetailPage__categoryRow">
            <span className="employerShiftDetailPage__categoryEmoji" aria-hidden="true">
              {getCategoryEmoji(vacancy.type || vacancy.category)}
            </span>
            <span>{getCategoryLabel(vacancy.type || vacancy.category)}</span>
          </div>

          {shift.address ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/map-pin.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>{shift.address}</span>
            </div>
          ) : null}

          <div className="applicationDetailPage__infoRow">
            <img src="/map-icons/losso.png" alt="" className="applicationDetailPage__infoIcon" />
            <span>{shift.salary}</span>
          </div>

          {shift.time ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/message-circle.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>
                {shift.time} · до {formatActiveUntil(vacancy.activeUntil, vacancy.activeUntilTime)}
              </span>
            </div>
          ) : null}

          <div className="applicationDetailPage__description">{description}</div>

          <div className="applicationDetailPage__mapWrap">
            <MapboxVacancyMap
              vacancies={[vacancy]}
              selectedVacancyId={vacancy.id}
              onSelect={() => {}}
              centerPoint={{ lat: vacancy.lat, lng: vacancy.lng, zoom: 13 }}
              className="applicationDetailPage__map"
            />
          </div>
        </article>

        <div className="applicationDetailPage__statusSection">
          <div className="applicationDetailPage__panelHead">
            <p className="applicationDetailPage__panelTitle">{shift.panelTitle}</p>
            {shift.panelSubtitle ? <p className="applicationDetailPage__panelSubtitle">{shift.panelSubtitle}</p> : null}
          </div>

          <div className="applicationDetailPage__progress">
            <div className="applicationDetailPage__progressTrack" aria-hidden="true">
              {EMPLOYER_SHIFT_PROGRESS_STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`applicationDetailPage__progressSegment${
                    index < shift.progressFilled ? ' applicationDetailPage__progressSegment--filled' : ''
                  }`}
                />
              ))}
            </div>
            <div className="applicationDetailPage__progressLabels">
              {EMPLOYER_SHIFT_PROGRESS_STAGES.map((stage) => (
                <span key={stage.id}>{stage.label}</span>
              ))}
            </div>
          </div>

          {shift.progressDetailText ? <p className="applicationDetailPage__progressDetail">{shift.progressDetailText}</p> : null}
        </div>

        {vacancy.status === 'archived' && vacancy.closureReview ? (
          <div className="employerShiftDetailPage__closureNote">
            <div className="employerShiftDetailPage__closureTitle">Комментарий при закрытии</div>
            <p>{vacancy.closureReview}</p>
          </div>
        ) : null}

        {completedTask ? (
          <div className="employerShiftDetailPage__ratingSection">
            <div className="employerShiftDetailPage__ratingHead">
              <h3>Исполнитель: {completedTask.workerName || 'Кандидат'}</h3>
              {completedTask.summary ? <p>{completedTask.summary}</p> : null}
            </div>
            <ShiftRatingBlock
              label={
                completedTask.employerToWorkerRating != null
                  ? 'Ваша оценка исполнителя'
                  : 'Оцените исполнителя'
              }
              value={completedTask.employerToWorkerRating}
              interactive={completedTask.employerToWorkerRating == null}
              disabled={isRating}
              onSelect={handleRateWorker}
            />
            {ratingError ? <div className="formError">{ratingError}</div> : null}
          </div>
        ) : null}

        <section className="employerShiftDetailPage__applicantsSection">
          <div className="employerShiftDetailPage__applicantsHead">
            <h3>Отклики</h3>
            <span>{formatApplicationCount(applications.length)}</span>
          </div>

          <label className="employerShiftDetailPage__search field">
            <span className="field__label">Поиск по кандидатам</span>
            <input
              className="input input--dark"
              value={candidateQuery}
              onChange={(event) => setCandidateQuery(event.target.value)}
              placeholder="Имя, телефон, email или Telegram"
            />
          </label>

          {statusError ? <div className="formError">{statusError}</div> : null}
          {archiveSuccess ? <p className="employerShiftDetailPage__hint">{archiveSuccess}</p> : null}
          {vacancy.status === 'pending_review' ? (
            <p className="employerShiftDetailPage__hint">Смена на модерации и появится на карте после одобрения.</p>
          ) : null}
          {vacancy.moderationReason ? <div className="formError">Причина отклонения: {vacancy.moderationReason}</div> : null}

          <div className="employerShiftDetailPage__applicants">
            {filteredApplications.length ? (
              filteredApplications.map((application) => {
                const item = normalizeApplication(application)
                const phoneHref = buildTelHref(application.applicantPhone)
                const tgHref = buildTelegramHref(application.applicantTelegram)
                const mailHref = buildMailtoHref(application.applicantEmail)
                const statusMeta = getApplicationStatusMeta(application.status)

                return (
                  <article key={application.id} className="employerShiftDetailPage__applicantCard">
                    <div className="employerShiftDetailPage__applicantTop">
                      <h4>{application.applicantName}</h4>
                      <div className={`applicationCard__badge applicationCard__badge--${statusMeta.variant}`}>
                        <span className="applicationCard__badgeDot" aria-hidden="true" />
                        <span>{item.statusLabel}</span>
                      </div>
                    </div>

                    <div className="employerShiftDetailPage__applicantFacts">
                      {application.applicantAge ? <span>Возраст: {application.applicantAge}</span> : null}
                      {application.applicantPhone ? (
                        <span>
                          Телефон:{' '}
                          {phoneHref ? (
                            <a className="applicationContactStrip__link" href={phoneHref}>
                              {application.applicantPhone}
                            </a>
                          ) : (
                            application.applicantPhone
                          )}
                        </span>
                      ) : null}
                      {application.applicantEmail ? (
                        <span>
                          Email:{' '}
                          {mailHref ? (
                            <a className="applicationContactStrip__link" href={mailHref}>
                              {application.applicantEmail}
                            </a>
                          ) : (
                            application.applicantEmail
                          )}
                        </span>
                      ) : null}
                      {application.applicantTelegram ? (
                        <span>
                          Telegram:{' '}
                          {tgHref ? (
                            <a className="applicationContactStrip__link" href={tgHref} target="_blank" rel="noreferrer">
                              @{String(application.applicantTelegram).replace(/^@+/, '')}
                            </a>
                          ) : (
                            application.applicantTelegram
                          )}
                        </span>
                      ) : null}
                    </div>

                    <p className="employerShiftDetailPage__applicantReview">
                      {application.applicantReview || 'Кандидат пока не добавил информацию о себе.'}
                    </p>

                    <div className="employerShiftDetailPage__applicantActions">
                      {application.status === 'pending' ? (
                        <button
                          type="button"
                          className="applicationDetailPage__ghostBtn"
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
                            className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary employerShiftDetailPage__inlineAction"
                            disabled={updatingApplicationId === application.id}
                            onClick={() => handleApplicationStatus(application.id, 'approved')}
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            className="applicationDetailPage__ghostBtn"
                            disabled={updatingApplicationId === application.id}
                            onClick={() => handleApplicationStatus(application.id, 'rejected')}
                          >
                            Отклонить
                          </button>
                        </>
                      ) : null}
                      {onOpenChat ? (
                        <button type="button" className="applicationDetailPage__ghostBtn" onClick={() => onOpenChat(application.id)}>
                          Чат
                        </button>
                      ) : null}
                      {onOpenUserProfile ? (
                        <button type="button" className="applicationDetailPage__ghostBtn" onClick={() => onOpenUserProfile(application.applicantId)}>
                          Профиль
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })
            ) : applications.length ? (
              <p className="employerShiftDetailPage__hint">По текущему поиску кандидаты не найдены.</p>
            ) : (
              <p className="employerShiftDetailPage__hint">Пока откликов нет. После первых откликов здесь появятся кандидаты.</p>
            )}
          </div>
        </section>
      </div>

      {showShiftActions ? (
        <div className="applicationDetailPage__fixedActions applicationDetailPage__fixedActions--single">
          <button
            type="button"
            className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary employerShiftDetailPage__completeBtn"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            Завершить смену
          </button>
        </div>
      ) : null}

      {showShiftClosure ? (
        <div className="applicationDetailPage__modalOverlay" onClick={cancelShiftClosure}>
          <div className="applicationDetailPage__modal employerShiftDetailPage__closureModal" onClick={(event) => event.stopPropagation()}>
            <h3 className="applicationDetailPage__modalTitle">Завершение смены</h3>
            <p className="applicationDetailPage__modalText">
              Укажите, кто выходил на смену, оставьте отзыв и поставьте оценку. Если смены не было — выберите «Никого».
            </p>

            <div className="employerShiftDetailPage__closureOptions">
              <label className="employerShiftDetailPage__closureOption">
                <input
                  type="radio"
                  name="closureApplicant"
                  value="none"
                  checked={closureApplicantId === 'none'}
                  onChange={() => {
                    setClosureApplicantId('none')
                    setClosureRating(null)
                  }}
                />
                <span>Никого / смена не состоялась</span>
              </label>
              {applications.map((application) => (
                <label key={application.id} className="employerShiftDetailPage__closureOption">
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

            <label className="field employerShiftDetailPage__closureField">
              <span className="field__label">Отзыв (необязательно)</span>
              <textarea
                className="input input--dark authForm__textarea"
                rows={3}
                value={closureReview}
                onChange={(event) => setClosureReview(event.target.value)}
                placeholder="Например, как прошла смена или благодарность."
              />
            </label>

            {closureApplicantId !== 'none' ? (
              <ShiftRatingBlock
                label="Оценка исполнителя"
                value={closureRating}
                interactive
                disabled={isArchiving}
                onSelect={setClosureRating}
              />
            ) : null}

            {archiveError ? <div className="formError">{archiveError}</div> : null}

            <div className="applicationDetailPage__modalActions">
              <button
                type="button"
                className="applicationDetailPage__modalBtn applicationDetailPage__modalBtn--ghost"
                onClick={cancelShiftClosure}
                disabled={isArchiving}
              >
                Отмена
              </button>
              <button
                type="button"
                className="applicationDetailPage__modalBtn applicationDetailPage__modalBtn--primary"
                onClick={confirmShiftClosure}
                disabled={isArchiving}
              >
                {isArchiving ? 'Сохраняем…' : 'Завершить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
