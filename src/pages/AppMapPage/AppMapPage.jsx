import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import './AppMapPage.css'

function VacancyDescriptionPreview({ description, requirements, onOpenVacancy }) {
  const openedRef = useRef(false)
  const touchStartY = useRef(0)

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
      onTouchStart={(event) => {
        touchStartY.current = event.touches[0]?.clientY ?? 0
      }}
      onTouchMove={(event) => {
        const currentY = event.touches[0]?.clientY ?? touchStartY.current
        if (Math.abs(currentY - touchStartY.current) > 8) {
          openVacancyPage()
        }
      }}
      onWheel={(event) => {
        if (Math.abs(event.deltaY) > 0) {
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
  selectedCityLabel,
  selectedCityPoint,
}) {
  const [previewVacancyId, setPreviewVacancyId] = useState(autoOpenVacancyId)
  const previewVacancy = useMemo(() => vacancies.find((vacancy) => vacancy.id === previewVacancyId) || null, [previewVacancyId, vacancies])

  const handleSelect = useCallback((vacancyId) => {
    onSelect(vacancyId)
    setPreviewVacancyId(vacancyId)
  }, [onSelect])

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
          centerPoint={selectedCityPoint}
          className="mapPlaceholder"
        />

        {vacancies.length === 0 ? (
          <div className="spotlightCard spotlightCard--floating">
            <div className="spotlightCard__title">Пока нет вакансий</div>
            <div className="spotlightCard__meta">По городу {selectedCityLabel} открытые смены еще не добавлены. Попробуй другой город или сбрось фильтры.</div>
          </div>
        ) : null}

        {previewVacancy ? (
          <aside 
            className="mapVacancySheet--custom" 
            aria-label={`Выбрана вакансия ${previewVacancy.title}`}
            onClick={() => handleSelect('')}
          >
            <div className="vacancySheet__top">
              <div className="badge-verified" onClick={(e) => e.stopPropagation()}>Проверенный заказчик</div>
              <div className="badge-applications-top" onClick={(e) => e.stopPropagation()}>{previewVacancy.applicationCount} отклика</div>
              
              <div className="vacancySheet__icon-circle-large" onClick={(e) => e.stopPropagation()}>
                <span className="vacancySheet__emoji">
                  {(() => {
                    const emojis = ['💻', '🚚', '🛒', '📦', '🍽️', '🎨', '🚗', '📚', '🛠️', '📄', '🐶']
                    const emojiIndex = previewVacancy.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % emojis.length
                    return emojis[emojiIndex]
                  })()}
                </span>
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
                <span className="vacancySheet__count-tag">уже {previewVacancy.applicationCount} отклика</span>
              </div>

              <VacancyDescriptionPreview
                description={previewVacancy.description}
                requirements={previewVacancy.requirements}
                onOpenVacancy={() => onOpenVacancy(previewVacancy.id)}
              />

              <div className="vacancySheet__footer">
                <div className="company-info">
                  <div className="company-logo-circle">
                    <img src="/map-icons/losso.png" alt="" style={{filter: 'invert(85%) sepia(44%) saturate(542%) hue-rotate(36deg) brightness(96%) contrast(91%)'}} />
                  </div>
                  <div className="company-details">
                    <div className="company-name">{previewVacancy.companyName}</div>
                    <div className="company-rating">Ресторан общ. пит. ★ 4.0 и 233 оценки</div>
                  </div>
                </div>
                
                <button className="apply-btn-main" onClick={() => onOpenVacancy(previewVacancy.id)}>
                  <img src="/map-icons/ОТКЛИК НУТЬСЯ.png" alt="ОТКЛИКНУТЬСЯ" />
                </button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
