import { useCallback, useEffect, useMemo, useState } from 'react'

import { getCategoryEmoji } from '../../constants/vacancyCategories'
import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import { VacancyPreviewSheet } from '../../components/VacancyPreviewSheet'
import './AppMapPage.css'

export function AppMapPage({
  vacancies,
  lassoSourceVacancies = vacancies,
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
  lassoActive = false,
  hasLassoSelection = false,
  onLassoSelectionChange,
}) {
  const [previewVacancyId, setPreviewVacancyId] = useState(autoOpenVacancyId)
  const previewVacancy = useMemo(() => vacancies.find((vacancy) => vacancy.id === previewVacancyId) || null, [previewVacancyId, vacancies])

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

  const handleClosePreview = useCallback(() => {
    handleSelect('')
  }, [handleSelect])

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
          lassoSourceVacancies={lassoSourceVacancies}
          selectedVacancyId={selectedVacancyId}
          onSelect={handleSelect}
          onLocationChange={onLocationChange}
          onVisibleVacanciesChange={onVisibleVacanciesChange}
          centerPoint={selectedCityPoint}
          className="mapPlaceholder"
          lassoActive={lassoActive}
          hasLassoSelection={hasLassoSelection}
          onLassoSelectionChange={onLassoSelectionChange}
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
          <VacancyPreviewSheet
            vacancy={previewVacancy}
            onClose={handleClosePreview}
            onOpenVacancy={onOpenVacancy}
            onOpenEmployerVacancy={onOpenEmployerVacancy}
            onOpenCompanyProfile={onOpenCompanyProfile}
            currentUser={currentUser}
            completedTasks={completedTasks}
            vacancies={vacancies}
          />
        ) : null}
      </div>
    </section>
  )
}
