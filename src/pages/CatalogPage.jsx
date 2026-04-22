import { Icon } from '../components/Icon'
import { CustomSelect } from '../components/CustomSelect'
import { ResponsiveFilters } from '../components/ResponsiveFilters'

const PAY_OPTIONS = [
  { value: '0', label: 'Любая ставка' },
  { value: '40', label: 'От 40 BYN' },
  { value: '60', label: 'От 60 BYN' },
  { value: '80', label: 'От 80 BYN' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Все категории' },
  { value: 'Курьер', label: 'Курьер' },
  { value: 'Склад', label: 'Склад' },
  { value: 'Промо', label: 'Промо' },
  { value: 'HoReCa', label: 'HoReCa' },
]

const SHIFT_DATE_OPTIONS = [
  { value: 'all', label: 'Любой день' },
  { value: 'Сегодня', label: 'Сегодня' },
  { value: 'Завтра', label: 'Завтра' },
  { value: 'Выходные', label: 'Выходные' },
]

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Сначала подходящие' },
  { value: 'salary', label: 'С высокой оплатой' },
  { value: 'distance', label: 'Ближе ко мне' },
  { value: 'date', label: 'По дате смены' },
]

const QUICK_FILTERS = [
  { id: 'all', label: 'Для вас', type: 'category', value: 'all' },
  { id: 'courier', label: 'Подработка', type: 'category', value: 'Курьер' },
  { id: 'warehouse', label: 'Склад', type: 'category', value: 'Склад' },
  { id: 'service', label: 'Сервис', type: 'category', value: 'HoReCa' },
  { id: 'today', label: 'Сегодня', type: 'shiftDate', value: 'Сегодня' },
  { id: 'weekend', label: 'Выходные', type: 'shiftDate', value: 'Выходные' },
]

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
}

export function CatalogPage({ filters, onFilterChange, vacancies, onShowMap, selectedCity, cityOptions, onCityChange, selectedCityLabel, currentUser, appliedVacancyIds, onApplyToVacancy, onOpenVacancy }) {
  const todayCount = vacancies.filter((vacancy) => vacancy.shiftDate === 'Сегодня').length
  const nearbyCount = vacancies.filter((vacancy) => vacancy.distanceKm <= 3).length
  const highPayCount = vacancies.filter((vacancy) => vacancy.payFrom >= 70).length

  function handleQuickFilterClick(filter) {
    if (filter.type === 'category') {
      onFilterChange('category', filter.value)
      if (filter.value === 'all') {
        onFilterChange('shiftDate', 'all')
      }
    }

    if (filter.type === 'shiftDate') {
      onFilterChange('shiftDate', filter.value)
    }
  }

  function resetFilters() {
    onFilterChange('query', '')
    onFilterChange('payMin', 0)
    onFilterChange('category', 'all')
    onFilterChange('shiftDate', 'all')
    onFilterChange('sortBy', 'relevant')
  }

  function isQuickFilterActive(filter) {
    if (filter.type === 'category') {
      return filters.category === filter.value && (filter.value !== 'all' || filters.shiftDate === 'all')
    }

    return filters.shiftDate === filter.value
  }

  return (
    <section className="catalogPage catalogShowcase">
      <div className="catalogHero">
        <div className="catalogSearch">
          <div className="catalogSearch__field">
            <Icon name="search" className="catalogSearch__icon" />
            <input
              className="catalogSearch__input"
              placeholder="Профессия, должность или компания"
              value={filters.query}
              onChange={(e) => onFilterChange('query', e.target.value)}
            />
          </div>

          <ResponsiveFilters buttonLabel="Фильтры" desktopClassName="catalogFilterBar">
            <CustomSelect
              value={String(filters.payMin)}
              options={PAY_OPTIONS}
              onChange={(nextValue) => onFilterChange('payMin', Number(nextValue))}
              triggerClassName="input input--dark"
            />
            <CustomSelect
              value={filters.category}
              options={CATEGORY_OPTIONS}
              onChange={(nextValue) => onFilterChange('category', nextValue)}
              triggerClassName="input input--dark"
            />
            <CustomSelect
              value={filters.shiftDate}
              options={SHIFT_DATE_OPTIONS}
              onChange={(nextValue) => onFilterChange('shiftDate', nextValue)}
              triggerClassName="input input--dark"
            />
            <CustomSelect
              value={filters.sortBy}
              options={SORT_OPTIONS}
              onChange={(nextValue) => onFilterChange('sortBy', nextValue)}
              triggerClassName="input input--dark"
            />
          </ResponsiveFilters>

          <button className="primaryButton catalogSearch__submit" type="button">
            Найти
          </button>
        </div>

        <div className="catalogQuickFilters" aria-label="Быстрые фильтры">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`catalogQuickFilters__chip ${isQuickFilterActive(filter) ? 'is-active' : ''}`}
              onClick={() => handleQuickFilterClick(filter)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="catalogLayout">
        <aside className="catalogSidebar">
          <div className="catalogWidget">
            <div className="catalogWidget__item">
              <div className="catalogWidget__meta">
                <Icon name="briefcase" className="catalogWidget__icon" />
                <span>Подходящих вакансий</span>
              </div>
              <span className="catalogWidget__value">{vacancies.length}</span>
            </div>

            <div className="catalogWidget__item">
              <div className="catalogWidget__meta">
                <span className="catalogWidget__dot" />
                <span>Смены на сегодня</span>
              </div>
              <span className="catalogWidget__value catalogWidget__value--accent">+{todayCount}</span>
            </div>

            <div className="catalogWidget__item">
              <div className="catalogWidget__meta">
                <Icon name="mapPin" className="catalogWidget__icon" />
                <span>Рядом с вами</span>
              </div>
              <span className="catalogWidget__value">{nearbyCount}</span>
            </div>

            <div className="catalogWidget__item">
              <div className="catalogWidget__meta">
                <Icon name="spark" className="catalogWidget__icon" />
                <span>Ставка от 70 BYN</span>
              </div>
              <span className="catalogWidget__value">{highPayCount}</span>
            </div>
          </div>

          <div className="catalogPromoCard">
            <div className="catalogPromoCard__title">Карта вакансий</div>
            <div className="catalogPromoCard__text">Открой карту, чтобы посмотреть смены рядом и быстрее выбрать ближайшую точку.</div>
            <button className="catalogPromoCard__link" type="button" onClick={onShowMap}>
              Открыть карту
            </button>
          </div>

          <div className="catalogPromoCard">
            <div className="catalogPromoCard__title">Сбросить фильтры</div>
            <div className="catalogPromoCard__text">Если хочешь снова увидеть всю выдачу, верни стандартные параметры поиска.</div>
            <button className="catalogPromoCard__link" type="button" onClick={resetFilters}>
              Сбросить
            </button>
          </div>
        </aside>

        <div className="catalogFeed">


          <div className="catalogCards">
            {vacancies.length ? (
              vacancies.map((vacancy) => (
                <article
                  key={vacancy.id}
                  className="catalogJobCard"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenVacancy(vacancy.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onOpenVacancy(vacancy.id)
                    }
                  }}
                >
                  <div className="catalogJobCard__main">
                    <div className="catalogJobCard__head">
                      <div>
                        <div className="catalogJobCard__title">{vacancy.title}</div>
                        <div className="catalogJobCard__salary">
                          {vacancy.payFrom} - {vacancy.payFrom + 20} BYN за смену
                        </div>
                      </div>

                    </div>

                    <div className="catalogJobCard__badges">
                      <span className="tag tag--accent">{vacancy.type}</span>
                      <span className="tag">{vacancy.shiftDate}</span>
                      <span className="tag">{vacancy.schedule}</span>
                      <span className="tag">{vacancy.duration}</span>
                      <span className="tag">{formatApplicationCount(vacancy.applicationCount)}</span>
                      {(vacancy.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="catalogJobCard__company">{vacancy.companyName}</div>
                    <div className="catalogJobCard__location">
                      {vacancy.address} • {vacancy.distanceKm.toFixed(1)} км от вас
                    </div>
                  </div>

                  <div className="catalogJobCard__footer">
                    <button
                      className="primaryButton"
                      type="button"
                      disabled={currentUser.role !== 'user' || appliedVacancyIds.includes(vacancy.id)}
                      onClick={(event) => {
                        event.stopPropagation()
                        onApplyToVacancy(vacancy.id)
                      }}
                    >
                      {currentUser.role !== 'user' ? 'Только для соискателей' : appliedVacancyIds.includes(vacancy.id) ? 'Отклик отправлен' : 'Откликнуться'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <article className="catalogJobCard catalogJobCard--empty">
                <div className="catalogJobCard__title">В городе {selectedCityLabel} пока нет открытых смен</div>
                <div className="catalogJobCard__location">Выбери другой город в хедере или открой карту, чтобы быстро переключиться на более активный регион.</div>
                <div className="catalogJobCard__footer">
                  <button className="primaryButton" type="button" onClick={onShowMap}>
                    Открыть карту
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

