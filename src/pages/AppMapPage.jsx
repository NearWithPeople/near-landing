import { useCallback, useEffect, useMemo, useState } from 'react'

import { MapboxVacancyMap } from '../components/MapboxVacancyMap'

export function AppMapPage({
  vacancies,
  selectedVacancyId,
  onSelect,
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
          centerPoint={selectedCityPoint}
          className="mapPlaceholder"
        />

        <div className="mapPanel__overlay mapPanel__overlay--topRight">
          <div className="mapStatsPill">{selectedCityLabel}</div>
          <div className="mapStatsPill">{vacancies.length} вакансий</div>
        </div>

        {vacancies.length === 0 ? (
          <div className="spotlightCard spotlightCard--floating">
            <div className="spotlightCard__title">Пока нет вакансий</div>
            <div className="spotlightCard__meta">По городу {selectedCityLabel} открытые смены еще не добавлены. Попробуй другой город или сбрось фильтры.</div>
          </div>
        ) : null}

        {previewVacancy ? (
          <aside className="mapVacancySheet" aria-label={`Выбрана вакансия ${previewVacancy.title}`}>
            <button type="button" className="mapVacancySheet__close" aria-label="Закрыть карточку вакансии" onClick={() => handleSelect('')}>
              <span aria-hidden>&times;</span>
            </button>

            <div className="mapVacancySheet__content">
              <div className="mapVacancySheet__eyebrow">
                <span className="tag tag--accent">от {previewVacancy.payFrom} BYN</span>
                <span className="tag">{previewVacancy.type}</span>
              </div>

              <div className="mapVacancySheet__title">{previewVacancy.title}</div>
              <div className="mapVacancySheet__company">{previewVacancy.companyName}</div>
              <div className="mapVacancySheet__meta">{previewVacancy.address}</div>

              <div className="tagRow mapVacancySheet__tags">
                <span className="tag">{previewVacancy.shiftDate}</span>
                <span className="tag">{previewVacancy.schedule}</span>
              </div>

              <button type="button" className="primaryButton primaryButton--wide mapVacancySheet__button" onClick={() => onOpenVacancy(previewVacancy.id)}>
                Перейти к вакансии
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
