import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getCategoryEmoji, getCategoryLabel } from '../../constants/vacancyCategories'
import { formatRatingLabel, getEmployerRatingSummary } from '../../utils/ratings'
import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import './AppMapPage.css'

function VacancyDescriptionPreview({ description, requirements, onOpenVacancy }) {
  const openedRef = useRef(false)

  const openVacancyPage = useCallback(() => {
    if (openedRef.current) return
    openedRef.current = true
    onOpenVacancy()
  }, [onOpenVacancy])

  useEffect(() => {
    openedRef.current = false
  }, [description])

  return (
    <div
      className="vacancySheet__description"
      role="button"
      tabIndex={0}
      aria-label="Открыть полное описание вакансии"
      onClick={openVacancyPage}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openVacancyPage()
        }
      }}
    >
      <div className="vacancySheet__desc-text">{description}</div>
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

export function AppMapPage({
  vacancies,
  selectedVacancyId,
  onSelect,
  onLocationChange,
  onOpenVacancy,
  autoOpenVacancyId = '',
  selectedCityPoint,
  visibleVacancies = [],
  onVisibleVacanciesChange,
  isNearbyListOpen = false,
  onNearbyListOpenChange,
  currentUser,
  completedTasks = [],
  onOpenCompanyProfile,
  onOpenEmployerVacancy,
}) {
  const [previewVacancyId, setPreviewVacancyId] = useState(autoOpenVacancyId)
  const previewVacancy = useMemo(() => vacancies.find((vacancy) => vacancy.id === previewVacancyId) || null, [previewVacancyId, vacancies])
  const companyRatingLabel = useMemo(() => {
    if (!previewVacancy?.ownerId) return 'Профиль компании'
    const summary = getEmployerRatingSummary({
      completedTasks,
      vacancies,
      ownerId: previewVacancy.ownerId,
      employerName: previewVacancy.companyName,
    })
    return formatRatingLabel(summary.rating, summary.count, 'Профиль компании')
  }, [completedTasks, previewVacancy, vacancies])
  const isOwnVacancy = currentUser?.role === 'employer' && previewVacancy?.ownerId === currentUser?.id

  const handleSelect = useCallback((vacancyId) => {
    onSelect(vacancyId)
    setPreviewVacancyId(vacancyId)
    if (vacancyId) {
      onNearbyListOpenChange?.(false)
    }
  }, [onNearbyListOpenChange, onSelect])

  const handleOpenNearbyVacancy = useCallback((vacancyId) => {
    handleSelect(vacancyId)
    onNearbyListOpenChange?.(false)
  }, [handleSelect, onNearbyListOpenChange])

  useEffect(() => {
    if (!autoOpenVacancyId) return
    if (vacancies.some((vacancy) => vacancy.id === autoOpenVacancyId)) {
      setPreviewVacancyId(autoOpenVacancyId)
    }
  }, [autoOpenVacancyId, vacancies])

  useEffect(() => {
    if (!previewVacancyId) return
    if (!vacancies.some((vacancy) => vacancy.id === previewVacancyId)) {
      handleSelect('')
    }
  }, [handleSelect, previewVacancyId, vacancies])

  return (
    <section className={`mapExperience mapExperience--fullscreen ${previewVacancyId ? 'has-preview' : ''}`}>
      <div className="mapPanel mapPanel--full">
        <MapboxVacancyMap
          vacancies={vacancies}
          selectedVacancyId={selectedVacancyId}
          onSelect={handleSelect}
          onLocationChange={onLocationChange}
          onVisibleVacanciesChange={onVisibleVacanciesChange}
          centerPoint={selectedCityPoint}
          className="mapPlaceholder"
        />

        {isNearbyListOpen ? (
          <aside className="mapNearbyList" aria-label="Вакансии на экране" onClick={() => onNearbyListOpenChange?.(false)}>
            <div className="mapNearbyList__panel" onClick={(event) => event.stopPropagation()}>
              <div className="mapNearbyList__header">
                <h2 className="mapNearbyList__title">Вакансии на экране</h2>
                <span className="mapNearbyList__count">{visibleVacancies.length}</span>
              </div>

              <div className="mapNearbyList__items">
                {visibleVacancies.length ? (
                  visibleVacancies.map((vacancy) => (
                    <button
                      key={vacancy.id}
                      type="button"
                      className={`mapNearbyList__item${selectedVacancyId === vacancy.id ? ' is-active' : ''}`}
                      onClick={() => handleOpenNearbyVacancy(vacancy.id)}
                    >
                      <div className="mapNearbyList__itemEmoji">{getCategoryEmoji(vacancy.type || vacancy.category)}</div>
                      <div className="mapNearbyList__itemMain">
                        <div className="mapNearbyList__itemTitle">{vacancy.title}</div>
                        <div className="mapNearbyList__itemSalary">от {vacancy.payFrom} Br за смену</div>
                        <div className="mapNearbyList__itemMeta">{vacancy.companyName}</div>
                        {vacancy.address ? <div className="mapNearbyList__itemAddress">{vacancy.address}</div> : null}
                      </div>
                      <span className="mapNearbyList__itemArrow" aria-hidden="true">›</span>
                    </button>
                  ))
                ) : (
                  <div className="mapNearbyList__empty">В видимой области карты пока нет вакансий. Подвиньте карту или измените масштаб.</div>
                )}
              </div>
            </div>
          </aside>
        ) : null}

        {previewVacancy ? (
          <aside 
            className="mapVacancySheet--custom" 
            aria-label={`Выбрана вакансия ${previewVacancy.title}`}
            onClick={() => handleSelect('')}
          >
            <div className="vacancySheet__top">
              <div className="vacancySheet__center-group" onClick={(e) => e.stopPropagation()}>
                <div className="badge-verified">Проверенный<br />заказчик</div>
                <div className="badge-applications-top">{previewVacancy.applicationCount} отклика</div>
                
                <div className="vacancySheet__icon-circle-large">
                  <span className="vacancySheet__emoji">{getCategoryEmoji(previewVacancy.type || previewVacancy.category)}</span>
                </div>
              </div>

              <div className="vacancySheet__quick-actions" onClick={(e) => e.stopPropagation()}>
                <button className="quick-action-btn">
                  <img src="/map-icons/message-circle.png" alt="Чат" />
                </button>
                <button className="quick-action-btn">
                  <img src="/map-icons/losso.png" alt="Избранное" />
                </button>
                <button className="quick-action-btn quick-action-btn--km">
                  <img src="/map-icons/locate-fixed.png" alt="" />
                  6.3 KM
                </button>
              </div>
            </div>

            <div className="vacancySheet__card" onClick={(e) => e.stopPropagation()}>
              <h2 className="vacancySheet__title">{previewVacancy.title}</h2>
              
              <div className="vacancySheet__sub-info">
                <span className="vacancySheet__salary">от {previewVacancy.payFrom} Br за смену, на руки</span>
                <span className="vacancySheet__count-tag">{getCategoryLabel(previewVacancy.type || previewVacancy.category)}</span>
              </div>

              <VacancyDescriptionPreview
                description={previewVacancy.description}
                requirements={previewVacancy.requirements}
                onOpenVacancy={() => onOpenVacancy(previewVacancy.id)}
              />

              <div className="vacancySheet__footer">
                <button
                  type="button"
                  className="company-info"
                  onClick={() => previewVacancy.ownerId && onOpenCompanyProfile?.(previewVacancy.ownerId)}
                >
                  <div className="company-logo-circle">
                    <span className="company-logo-emoji">{getCategoryEmoji(previewVacancy.type || previewVacancy.category)}</span>
                  </div>
                  <div className="company-details">
                    <div className="company-name">{previewVacancy.companyName}</div>
                    <div className="company-rating">{companyRatingLabel}</div>
                  </div>
                </button>
                
                {isOwnVacancy ? (
                  <button className="apply-btn-main" onClick={() => onOpenEmployerVacancy?.(previewVacancy.id)}>
                    Управлять
                  </button>
                ) : currentUser?.role !== 'employer' ? (
                  <button className="apply-btn-main" onClick={() => onOpenVacancy(previewVacancy.id)}>
                    <img src="/map-icons/ОТКЛИК НУТЬСЯ.png" alt="Откликнуться" className="apply-btn-img-only" />
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
