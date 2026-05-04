import { CustomSelect } from './CustomSelect'
import { ResponsiveFilters } from './ResponsiveFilters'

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

export const MAP_FILTER_DEFAULTS = {
  category: 'all',
  shiftDate: 'all',
  payMin: 0,
  sortBy: 'relevant',
  query: '',
}

export function MapFiltersToolbar({ filters, onFilterChange, categoryOptions, payOptions }) {
  return (
    <ResponsiveFilters buttonLabel="Фильтры" desktopClassName="mapToolbar" className="responsiveFilters--map">
      <CustomSelect
        value={filters.category}
        options={categoryOptions}
        onChange={(nextValue) => onFilterChange('category', nextValue)}
        triggerClassName="mapToolbar__control"
        isClearable
        isActive={filters.category !== MAP_FILTER_DEFAULTS.category}
        onClear={() => onFilterChange('category', MAP_FILTER_DEFAULTS.category)}
        clearAriaLabel="Сбросить категорию"
      />

      <CustomSelect
        value={filters.shiftDate}
        options={SHIFT_DATE_OPTIONS}
        onChange={(nextValue) => onFilterChange('shiftDate', nextValue)}
        triggerClassName="mapToolbar__control"
        isClearable
        isActive={filters.shiftDate !== MAP_FILTER_DEFAULTS.shiftDate}
        onClear={() => onFilterChange('shiftDate', MAP_FILTER_DEFAULTS.shiftDate)}
        clearAriaLabel="Сбросить дату смены"
      />

      <CustomSelect
        value={String(filters.payMin)}
        options={payOptions}
        onChange={(nextValue) => onFilterChange('payMin', Number(nextValue))}
        triggerClassName="mapToolbar__control"
        isClearable
        isActive={filters.payMin !== MAP_FILTER_DEFAULTS.payMin}
        onClear={() => onFilterChange('payMin', MAP_FILTER_DEFAULTS.payMin)}
        clearAriaLabel="Сбросить оплату"
      />

      <CustomSelect
        value={filters.sortBy}
        options={SORT_OPTIONS}
        onChange={(nextValue) => onFilterChange('sortBy', nextValue)}
        triggerClassName="mapToolbar__control"
        isClearable
        isActive={filters.sortBy !== MAP_FILTER_DEFAULTS.sortBy}
        onClear={() => onFilterChange('sortBy', MAP_FILTER_DEFAULTS.sortBy)}
        clearAriaLabel="Сбросить сортировку"
      />

      <div className={`mapToolbar__searchWrap ${filters.query ? 'is-active' : ''}`.trim()}>
        <input className="mapToolbar__search" placeholder="Поиск по вакансиям" value={filters.query} onChange={(e) => onFilterChange('query', e.target.value)} />
        {filters.query ? (
          <button type="button" className="mapToolbar__clear" aria-label="Сбросить поиск" onClick={() => onFilterChange('query', MAP_FILTER_DEFAULTS.query)}>
            <span aria-hidden>&times;</span>
          </button>
        ) : null}
      </div>
    </ResponsiveFilters>
  )
}
