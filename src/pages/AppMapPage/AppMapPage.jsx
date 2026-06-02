import { useCallback, useEffect, useMemo, useState } from 'react'

import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import './AppMapPage.css'

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
    <section className="mapExperience mapExperience--fullscreen">
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
          <aside className="mapVacancySheet--custom" aria-label={`Выбрана вакансия ${previewVacancy.title}`}>
            <div className="vacancySheet__header">
              <div className="vacancySheet__icon-circle">
                <div className="badge-verified">Проверенный заказчик</div>
                <div className="badge-applications">{previewVacancy.applicationCount} отклика</div>
                <img 
                  src={
                    {
                      'Курьер': '/map-icons/map-pin.png',
                      'Склад': '/map-icons/notepad-text.png',
                      'Промо': '/map-icons/losso.png',
                      'HoReCa': '/map-icons/list.png',
                      'Подсобные': '/map-icons/notepad-text.png'
                    }[previewVacancy.category] || '/map-icons/map-pin.png'
                  } 
                  alt="" 
                  className="vacancySheet__icon-img" 
                />
              </div>
            </div>

            <div className="vacancySheet__title">{previewVacancy.title}</div>
            <div className="vacancySheet__salary">от {previewVacancy.payFrom} Br за смену, на руки</div>

            <div className="vacancySheet__actions">
              <button className="action-btn">
                <img src="/map-icons/message-circle.png" alt="Чат" />
              </button>
              <button className="action-btn">
                <img src="/map-icons/losso.png" alt="Избранное" />
              </button>
              <button className="action-btn action-btn--km">
                <img src="/map-icons/locate-fixed.png" alt="" />
                6.3 KM
              </button>
            </div>

            <div className="vacancySheet__description">
              <div className="vacancySheet__desc-text">
                {previewVacancy.description}
              </div>
              <div className="vacancySheet__requirements">
                {previewVacancy.requirements?.map((req, idx) => (
                  <div key={idx} className="requirement-item">
                    <img src="/map-icons/notepad-text.png" alt="" className="requirement-icon" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="vacancySheet__footer">
              <div className="company-info">
                <div className="company-logo">
                  <img src="/map-icons/map-pin.png" alt="" />
                </div>
                <div>
                  <div className="company-name">{previewVacancy.companyName}</div>
                  <div className="company-rating">Ресторан общ. пит. ★ 4.0 и 233 оценки</div>
                </div>
              </div>
              <button className="action-btn" onClick={() => handleSelect('')}>
                <span style={{color: '#fff', fontSize: '24px'}}>&times;</span>
              </button>
            </div>

            <button className="apply-btn-large" onClick={() => onOpenVacancy(previewVacancy.id)}>
              <img src="/map-icons/ОТКЛИК НУТЬСЯ.png" alt="ОТКЛИКНУТЬСЯ" />
            </button>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
