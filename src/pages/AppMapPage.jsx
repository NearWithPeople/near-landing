import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapboxVacancyMap } from '../components/MapboxVacancyMap'
import { CustomSelect } from '../components/CustomSelect'
import { ResponsiveFilters } from '../components/ResponsiveFilters'

const SHIFT_DATE_OPTIONS = [
  { value: 'all', label: 'Любой день' },
  { value: 'Сегодня', label: 'Сегодня' },
  { value: 'Завтра', label: 'Завтра' },
  { value: 'Выходные', label: 'Выходные' },
]

const SORT_OPTIONS = [
  { value: 'relevant', label: 'По релевантности' },
  { value: 'salary', label: 'По оплате' },
  { value: 'distance', label: 'По расстоянию' },
  { value: 'date', label: 'По дате' },
]

const DEFAULT_FILTERS = {
  category: 'all',
  shiftDate: 'all',
  payMin: 0,
  sortBy: 'relevant',
  query: '',
}

export function AppMapPage({
  vacancies,
  selectedVacancyId,
  onSelect,
  onOpenVacancy,
  autoOpenVacancyId = '',
  filters,
  onFilterChange,
  categoryOptions,
  payOptions,
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
        <div className="mapPanel__toolbar">
          <ResponsiveFilters buttonLabel="Фильтры" desktopClassName="mapToolbar" className="responsiveFilters--map">
            <CustomSelect
              value={filters.category}
              options={categoryOptions}
              onChange={(nextValue) => onFilterChange('category', nextValue)}
              triggerClassName="mapToolbar__control"
              isClearable
              isActive={filters.category !== DEFAULT_FILTERS.category}
              onClear={() => onFilterChange('category', DEFAULT_FILTERS.category)}
              clearAriaLabel="Сбросить категорию"
            />

            <CustomSelect
              value={filters.shiftDate}
              options={SHIFT_DATE_OPTIONS}
              onChange={(nextValue) => onFilterChange('shiftDate', nextValue)}
              triggerClassName="mapToolbar__control"
              isClearable
              isActive={filters.shiftDate !== DEFAULT_FILTERS.shiftDate}
              onClear={() => onFilterChange('shiftDate', DEFAULT_FILTERS.shiftDate)}
              clearAriaLabel="Сбросить дату смены"
            />

            <CustomSelect
              value={String(filters.payMin)}
              options={payOptions}
              onChange={(nextValue) => onFilterChange('payMin', Number(nextValue))}
              triggerClassName="mapToolbar__control"
              isClearable
              isActive={filters.payMin !== DEFAULT_FILTERS.payMin}
              onClear={() => onFilterChange('payMin', DEFAULT_FILTERS.payMin)}
              clearAriaLabel="Сбросить оплату"
            />

            <CustomSelect
              value={filters.sortBy}
              options={SORT_OPTIONS}
              onChange={(nextValue) => onFilterChange('sortBy', nextValue)}
              triggerClassName="mapToolbar__control"
              isClearable
              isActive={filters.sortBy !== DEFAULT_FILTERS.sortBy}
              onClear={() => onFilterChange('sortBy', DEFAULT_FILTERS.sortBy)}
              clearAriaLabel="Сбросить сортировку"
            />

            <div className={`mapToolbar__searchWrap ${filters.query ? 'is-active' : ''}`.trim()}>
              <input
                className="mapToolbar__search"
                placeholder="Поиск по вакансиям"
                value={filters.query}
                onChange={(e) => onFilterChange('query', e.target.value)}
              />
              {filters.query ? (
                <button type="button" className="mapToolbar__clear" aria-label="Сбросить поиск" onClick={() => onFilterChange('query', DEFAULT_FILTERS.query)}>
                  <span aria-hidden>&times;</span>
                </button>
              ) : null}
            </div>
          </ResponsiveFilters>
        </div>

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
                <span className="tag">{previewVacancy.duration}</span>
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

