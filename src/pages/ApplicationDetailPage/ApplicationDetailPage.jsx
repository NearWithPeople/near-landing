import { useMemo, useState } from 'react'
import { ShiftRatingBlock } from '../../components/ShiftRatingBlock'
import {
  APPLICATION_PROGRESS_STAGES,
  formatApplicationSalary,
  normalizeApplication,
} from '../../utils/applicationPresentation'
import { formatRatingLabel, getEmployerRatingSummary } from '../../utils/ratings'
import './ApplicationDetailPage.css'

export function ApplicationDetailPage({
  application,
  vacancy,
  vacancies = [],
  onBack,
  onOpenChat,
  onCancel,
  onOpenCompanyProfile,
  completedTasks = [],
  onRateCompletedTask,
  emptyBackLabel = 'Назад к откликам',
  emptyMessage = 'Не найдено',
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [isRating, setIsRating] = useState(false)

  const companyRatingSummary = useMemo(() => {
    if (!application || !vacancy?.ownerId) return null
    return getEmployerRatingSummary({
      completedTasks,
      vacancies,
      ownerId: vacancy.ownerId,
      employerName: vacancy.companyName || application.employerName,
    })
  }, [application, completedTasks, vacancies, vacancy])

  const completedTask = useMemo(
    () => (application ? completedTasks.find((task) => task.vacancyId === application.vacancyId) || null : null),
    [application, completedTasks]
  )

  if (!application) {
    return (
      <section className="applicationDetailPage">
        <div className="applicationDetailPage__empty">
          <p>{emptyMessage}</p>
          <button type="button" className="applicationDetailPage__ghostBtn" onClick={onBack}>
            {emptyBackLabel}
          </button>
        </div>
      </section>
    )
  }

  const item = normalizeApplication(application)
  const title = item.vacancyTitle
  const address = item.address
  const salary = item.salary || formatApplicationSalary(null, item)
  const time = item.time
  const requirements = item.requirements || []
  const description = item.description || 'Подробности смены появятся, когда работодатель заполнит описание вакансии.'
  const progressFilled = Math.max(0, Math.min(APPLICATION_PROGRESS_STAGES.length, item.progressFilled || 0))
  const showApplicationActions = item.statusVariant === 'pending' || item.statusVariant === 'active'
  const pageTitle = 'Детали заказа'
  const companyRatingLabel = companyRatingSummary
    ? formatRatingLabel(companyRatingSummary.rating, companyRatingSummary.count)
    : ''

  async function handleRateEmployer(rating) {
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

  return (
    <section className="applicationDetailPage">
      <div className="applicationDetailPage__topbar">
        <button type="button" className="applicationDetailPage__back" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h1 className="applicationDetailPage__topTitle">{pageTitle}</h1>
        <div className={`applicationDetailPage__statusBadge applicationDetailPage__statusBadge--${item.statusVariant}`}>
          <span className="applicationDetailPage__statusDot" aria-hidden="true" />
          <span>{item.statusLabel}</span>
        </div>
      </div>

      <div className="applicationDetailPage__scroll">
        <article className="applicationDetailPage__card">
          <div className="applicationDetailPage__cardHead">
            <h2 className="applicationDetailPage__title">{title}</h2>
            <div className="applicationDetailPage__cardActions" style={{ position: 'relative' }}>
              <button type="button" className="applicationDetailPage__iconBtn" aria-label="SOS">
                SOS
              </button>
              <button
                type="button"
                className="applicationDetailPage__iconBtn applicationDetailPage__iconBtn--menu"
                aria-label="Меню"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                •••
              </button>
              {menuOpen ? (
                <div className="applicationDetailPage__dropdown">
                  <button type="button" onClick={() => { setMenuOpen(false); alert('Служба поддержки: support@near.by'); }}>
                    <span className="dropdown-icon">ℹ️</span> Нужна помощь
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); setShowCancelConfirm(true); }}>
                    <span className="dropdown-icon">❌</span> Отказаться
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); onOpenChat?.(); }}>
                    <span className="dropdown-icon">💬</span> Связаться
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {address ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/map-pin.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>{address}</span>
            </div>
          ) : null}

          <div className="applicationDetailPage__infoRow">
            <img src="/map-icons/losso.png" alt="" className="applicationDetailPage__infoIcon" />
            <span>{salary}</span>
          </div>

          {time ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/message-circle.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>{time}</span>
            </div>
          ) : null}

          {requirements.map((requirement) => (
            <div key={requirement} className="applicationDetailPage__requirement">
              <span className="applicationDetailPage__check" aria-hidden="true" />
              <span>{requirement}</span>
            </div>
          ))}

          {vacancy?.companyName ? (
            <button type="button" className="applicationDetailPage__companyCard" onClick={onOpenCompanyProfile}>
              <div className="applicationDetailPage__companyAvatar">{(vacancy.companyName || 'К')[0]}</div>
              <div>
                <div className="applicationDetailPage__companyName">{vacancy.companyName}</div>
                <div className="applicationDetailPage__companyRating">{companyRatingLabel || 'Профиль компании'}</div>
              </div>
            </button>
          ) : null}

          <div className="applicationDetailPage__description">{description}</div>
        </article>

        <div className="applicationDetailPage__statusSection">
          <div className="applicationDetailPage__panelHead">
            <p className="applicationDetailPage__panelTitle">{item.panelTitle}</p>
            {item.panelSubtitle ? <p className="applicationDetailPage__panelSubtitle">{item.panelSubtitle}</p> : null}
          </div>

          <div className="applicationDetailPage__progress">
            <div className="applicationDetailPage__progressTrack" aria-hidden="true">
              {APPLICATION_PROGRESS_STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`applicationDetailPage__progressSegment${
                    index < progressFilled ? ' applicationDetailPage__progressSegment--filled' : ''
                  }`}
                />
              ))}
            </div>
            <div className="applicationDetailPage__progressLabels">
              {APPLICATION_PROGRESS_STAGES.map((stage) => (
                <span key={stage.id}>{stage.label}</span>
              ))}
            </div>
          </div>

          {item.progressDetailText ? <p className="applicationDetailPage__progressDetail">{item.progressDetailText}</p> : null}
        </div>

        {item.statusVariant === 'completed' && completedTask ? (
          <div className="applicationDetailPage__statusSection">
            <div className="applicationDetailPage__panelHead">
              <p className="applicationDetailPage__panelTitle">Оцените работодателя</p>
              {completedTask.summary ? (
                <p className="applicationDetailPage__panelSubtitle">{completedTask.summary}</p>
              ) : null}
            </div>
            <ShiftRatingBlock
              label={
                completedTask.workerToEmployerRating != null
                  ? 'Ваша оценка работодателя'
                  : 'Поставьте оценку от 1 до 5'
              }
              value={completedTask.workerToEmployerRating}
              interactive={completedTask.workerToEmployerRating == null}
              disabled={isRating}
              onSelect={handleRateEmployer}
            />
            {ratingError ? <div className="formError">{ratingError}</div> : null}
          </div>
        ) : null}
      </div>

      {showApplicationActions ? (
        <div className="applicationDetailPage__fixedActions">
          <button type="button" className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--ghost" onClick={() => setShowCancelConfirm(true)}>
            <span aria-hidden="true">×</span>
            Отказаться
          </button>
          <button type="button" className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary" onClick={onOpenChat}>
            <img src="/map-icons/message-circle.png" alt="" />
            Перейти в чат
          </button>
        </div>
      ) : null}

      {showCancelConfirm ? (
        <div className="applicationDetailPage__modalOverlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="applicationDetailPage__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="applicationDetailPage__modalTitle">Отказаться от смены?</h3>
            <p className="applicationDetailPage__modalText">
              Вы уверены, что хотите отказаться от этой смены? Это действие нельзя отменить, и работодатель получит уведомление.
            </p>
            <div className="applicationDetailPage__modalActions">
              <button
                type="button"
                className="applicationDetailPage__modalBtn applicationDetailPage__modalBtn--ghost"
                onClick={() => setShowCancelConfirm(false)}
              >
                Назад
              </button>
              <button
                type="button"
                className="applicationDetailPage__modalBtn applicationDetailPage__modalBtn--danger"
                onClick={() => {
                  setShowCancelConfirm(false)
                  onCancel?.()
                }}
              >
                Отказаться
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
