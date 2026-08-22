import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { getCategoryEmoji, getCategoryLabel, getCategoryMarkerStyle } from '../constants/vacancyCategories'
import { formatRatingLabel, getEmployerRatingSummary } from '../utils/ratings'

function VacancyDescriptionPreview({ description, requirements, onOpenVacancy }) {
  const textRef = useRef(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const normalizedDescription = String(description || '').trim() || 'Описание появится, когда работодатель заполнит детали смены.'

  useLayoutEffect(() => {
    const element = textRef.current
    if (!element) return undefined

    function measure() {
      setIsTruncated(element.scrollHeight > element.clientHeight + 1)
    }

    measure()
    window.addEventListener('resize', measure)

    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [normalizedDescription])

  const canOpenDetails = typeof onOpenVacancy === 'function'

  return (
    <div
      className={`vacancySheet__description${canOpenDetails ? ' vacancySheet__description--clickable' : ''}`}
      role={canOpenDetails ? 'button' : undefined}
      tabIndex={canOpenDetails ? 0 : undefined}
      aria-label={canOpenDetails ? 'Открыть вакансию' : undefined}
      onClick={canOpenDetails ? onOpenVacancy : undefined}
      onKeyDown={
        canOpenDetails
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenVacancy()
              }
            }
          : undefined
      }
    >
      <div ref={textRef} className="vacancySheet__desc-text">
        {normalizedDescription}
      </div>
      {isTruncated ? <div className="vacancySheet__readMore">Читать полностью</div> : null}
      <div className="vacancySheet__requirements">
        {requirements?.map((req) => (
          <div key={req} className="requirement-item">
            <img src="/map-icons/notepad-text.png" alt="" className="requirement-icon" />
            <span>{req}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VacancyPreviewSheet({
  vacancy,
  onClose,
  onOpenVacancy,
  onOpenEmployerVacancy,
  onOpenCompanyProfile,
  currentUser,
  completedTasks = [],
  vacancies = [],
}) {
  const companyRatingLabel = useMemo(() => {
    if (!vacancy?.ownerId) return 'Профиль компании'
    const summary = getEmployerRatingSummary({
      completedTasks,
      vacancies,
      ownerId: vacancy.ownerId,
      employerName: vacancy.companyName,
    })
    return formatRatingLabel(summary.rating, summary.count, 'Профиль компании')
  }, [completedTasks, vacancy, vacancies])

  const isOwnVacancy = currentUser?.role === 'employer' && vacancy?.ownerId === currentUser?.id
  const canOpenVacancyDetails = isOwnVacancy || currentUser?.role !== 'employer'
  const categoryEmoji = getCategoryEmoji(vacancy.type || vacancy.category)
  const categoryMarkerStyle = useMemo(
    () => getCategoryMarkerStyle(vacancy.type || vacancy.category),
    [vacancy.type, vacancy.category],
  )

  const handleViewVacancyDetails = useCallback(() => {
    if (!vacancy) return
    if (isOwnVacancy) {
      onOpenEmployerVacancy?.(vacancy.id)
      return
    }
    if (currentUser?.role !== 'employer') {
      onOpenVacancy?.(vacancy.id)
    }
  }, [currentUser?.role, isOwnVacancy, onOpenEmployerVacancy, onOpenVacancy, vacancy])

  const handleApply = useCallback(() => {
    if (!vacancy) return
    onOpenVacancy?.(vacancy.id)
    onClose?.()
  }, [onClose, onOpenVacancy, vacancy])

  if (!vacancy) return null

  return (
    <aside
      className="mapVacancySheet--custom"
      aria-label={`Выбрана вакансия ${vacancy.title}`}
      role="dialog"
    >
      <button type="button" className="mapVacancySheet__backdrop" aria-label="Закрыть" onClick={onClose} />

      <button type="button" className="vacancySheet__close" aria-label="Закрыть" onClick={onClose}>
        ×
      </button>

      <div className="vacancySheet__layout">
        <div className="vacancySheet__hero">
          <div className="vacancySheet__badges">
            <div className="vacancySheet__badge vacancySheet__badge--verified">
              Проверенный
              <br />
              заказчик
            </div>
            <div className="vacancySheet__badge vacancySheet__badge--applications">
              {vacancy.applicationCount} отклика
            </div>
          </div>

          <div className="vacancySheet__center-group">
            <div
              className="frosted-circle vacancySheet__icon-circle category-colored-bubble"
              style={{
                '--marker-fill': categoryMarkerStyle.fill,
                '--marker-glow': categoryMarkerStyle.glow,
              }}
            >
              <span className="vacancySheet__emoji">{categoryEmoji}</span>
            </div>
          </div>

          <div className="vacancySheet__quick-actions">
            <button type="button" className="quick-action-btn">
              <img src="/map-icons/message-circle.png" alt="Чат" />
            </button>
            <button type="button" className="quick-action-btn">
              <img src="/map-icons/losso.png" alt="Избранное" />
            </button>
            <button type="button" className="quick-action-btn quick-action-btn--km">
              <img src="/map-icons/locate-fixed.png" alt="" />
              6.3 KM
            </button>
          </div>
        </div>

        <div className="vacancySheet__card" onClick={(event) => event.stopPropagation()}>
          <h2 className="vacancySheet__title">{vacancy.title}</h2>

          <div className="vacancySheet__sub-info">
            <span className="vacancySheet__salary">от {vacancy.payFrom} Br за смену, на руки</span>
            <span className="vacancySheet__count-tag">{getCategoryLabel(vacancy.type || vacancy.category)}</span>
          </div>

          <VacancyDescriptionPreview
            description={vacancy.description}
            requirements={vacancy.requirements}
            onOpenVacancy={canOpenVacancyDetails ? handleViewVacancyDetails : undefined}
          />

          <div className="vacancySheet__footer">
            <button
              type="button"
              className="company-info"
              onClick={() => {
                if (!vacancy.ownerId) return
                onOpenCompanyProfile?.(vacancy.ownerId)
              }}
            >
              <div className="company-logo-circle">
                <span className="company-logo-emoji">{categoryEmoji}</span>
              </div>
              <div className="company-details">
                <div className="company-name">{vacancy.companyName}</div>
                <div className="company-rating">{companyRatingLabel}</div>
              </div>
            </button>

            {isOwnVacancy ? (
              <button type="button" className="apply-btn-main" onClick={() => onOpenEmployerVacancy?.(vacancy.id)}>
                Управлять
              </button>
            ) : currentUser?.role !== 'employer' ? (
              <button type="button" className="apply-btn-main" onClick={handleApply}>
                <img src="/map-icons/ОТКЛИК НУТЬСЯ.png" alt="Откликнуться" className="apply-btn-img-only" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
