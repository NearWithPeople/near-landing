import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { getCategoryEmoji } from '../constants/vacancyCategories'

export const MAP_FILTER_DEFAULTS = {
  category: 'all',
  shiftDate: 'all',
  payMin: 0,
  sortBy: 'relevant',
  query: '',
}

const FILTER_ICONS = {
  category: '🗂️',
  shiftDate: '📅',
  payMin: '💰',
  sortBy: '↕️',
  query: '🔍',
}

function getOptionLabel(options, value, fallback = 'Не выбрано') {
  return options.find((option) => option.value === value)?.label || fallback
}

function FilterOptionRow({ option, isActive, emoji, onSelect }) {
  return (
    <button
      type="button"
      className={`mapNearbyList__item mapFiltersList__option${isActive ? ' is-active' : ''}`}
      onClick={() => onSelect(option.value)}
    >
      <div className="mapNearbyList__itemEmoji">{emoji || '•'}</div>
      <div className="mapNearbyList__itemMain">
        <div className="mapNearbyList__itemTitle">{option.label}</div>
      </div>
      {isActive ? <span className="mapFiltersList__check">✓</span> : <span className="mapNearbyList__itemArrow">›</span>}
    </button>
  )
}

export function MapFiltersSheet({
  isOpen,
  onOpenChange,
  filters,
  onFilterChange,
  categoryOptions,
  payOptions,
  shiftDateOptions,
  sortOptions,
}) {
  const [expandedFilter, setExpandedFilter] = useState('')

  const activeFilterCount = useMemo(
    () =>
      [
        filters.category !== MAP_FILTER_DEFAULTS.category,
        filters.shiftDate !== MAP_FILTER_DEFAULTS.shiftDate,
        filters.payMin !== MAP_FILTER_DEFAULTS.payMin,
        filters.sortBy !== MAP_FILTER_DEFAULTS.sortBy,
        filters.query.trim() !== MAP_FILTER_DEFAULTS.query,
      ].filter(Boolean).length,
    [filters.category, filters.payMin, filters.query, filters.shiftDate, filters.sortBy],
  )

  const filterSections = useMemo(
    () => [
      {
        id: 'category',
        title: 'Категория',
        valueLabel: getOptionLabel(categoryOptions, filters.category, 'Все категории'),
        emoji: filters.category === 'all' ? FILTER_ICONS.category : getCategoryEmoji(filters.category),
        isActive: filters.category !== MAP_FILTER_DEFAULTS.category,
        options: categoryOptions,
        getOptionEmoji: (option) => (option.value === 'all' ? FILTER_ICONS.category : getCategoryEmoji(option.value)),
      },
      {
        id: 'shiftDate',
        title: 'Когда смена',
        valueLabel: getOptionLabel(shiftDateOptions, filters.shiftDate, 'Любой день'),
        emoji: FILTER_ICONS.shiftDate,
        isActive: filters.shiftDate !== MAP_FILTER_DEFAULTS.shiftDate,
        options: shiftDateOptions,
      },
      {
        id: 'payMin',
        title: 'Оплата от',
        valueLabel: getOptionLabel(payOptions, String(filters.payMin), 'Любая ставка'),
        emoji: FILTER_ICONS.payMin,
        isActive: filters.payMin !== MAP_FILTER_DEFAULTS.payMin,
        options: payOptions,
      },
      {
        id: 'sortBy',
        title: 'Сортировка',
        valueLabel: getOptionLabel(sortOptions, filters.sortBy, 'По релевантности'),
        emoji: FILTER_ICONS.sortBy,
        isActive: filters.sortBy !== MAP_FILTER_DEFAULTS.sortBy,
        options: sortOptions,
      },
    ],
    [categoryOptions, filters.category, filters.payMin, filters.shiftDate, filters.sortBy, payOptions, shiftDateOptions, sortOptions],
  )

  useEffect(() => {
    if (!isOpen) {
      setExpandedFilter('')
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onOpenChange?.(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onOpenChange])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  function handleToggleSection(sectionId) {
    setExpandedFilter((current) => (current === sectionId ? '' : sectionId))
  }

  function handleSelect(sectionId, value) {
    onFilterChange(sectionId, sectionId === 'payMin' ? Number(value) : value)
    setExpandedFilter('')
  }

  return createPortal(
    <aside className="mapNearbyList mapFiltersList" aria-label="Фильтры карты" onClick={() => onOpenChange?.(false)}>
      <div className="mapNearbyList__panel mapFiltersList__panel" onClick={(event) => event.stopPropagation()}>
        <div className="mapNearbyList__header">
          <h2 className="mapNearbyList__title">Фильтры</h2>
          <span className="mapNearbyList__count">{activeFilterCount || 'Все'}</span>
        </div>

        <div className="mapNearbyList__items mapFiltersList__items">
          {filterSections.map((section) => {
            const isExpanded = expandedFilter === section.id
            const currentValue = section.id === 'payMin' ? String(filters.payMin) : filters[section.id]

            return (
              <div key={section.id} className="mapFiltersList__group">
                <button
                  type="button"
                  className={`mapNearbyList__item mapFiltersList__section${section.isActive ? ' is-active' : ''}${isExpanded ? ' is-expanded' : ''}`}
                  onClick={() => handleToggleSection(section.id)}
                >
                  <div className="mapNearbyList__itemEmoji">{section.emoji}</div>
                  <div className="mapNearbyList__itemMain">
                    <div className="mapNearbyList__itemTitle">{section.title}</div>
                    <div className="mapNearbyList__itemSalary">{section.valueLabel}</div>
                  </div>
                  <span className="mapNearbyList__itemArrow">{isExpanded ? '⌄' : '›'}</span>
                </button>

                {isExpanded
                  ? section.options.map((option) => (
                      <FilterOptionRow
                        key={option.value}
                        option={option}
                        isActive={option.value === currentValue}
                        emoji={section.getOptionEmoji?.(option)}
                        onSelect={(value) => handleSelect(section.id, value)}
                      />
                    ))
                  : null}
              </div>
            )
          })}

          <div className={`mapNearbyList__item mapFiltersList__search${filters.query ? ' is-active' : ''}`}>
            <div className="mapNearbyList__itemEmoji">{FILTER_ICONS.query}</div>
            <div className="mapNearbyList__itemMain">
              <div className="mapNearbyList__itemTitle">Поиск</div>
              <input
                className="mapFiltersList__searchInput"
                placeholder="Название, компания, адрес"
                value={filters.query}
                onChange={(event) => onFilterChange('query', event.target.value)}
              />
            </div>
            {filters.query ? (
              <button
                type="button"
                className="mapFiltersList__clear"
                aria-label="Сбросить поиск"
                onClick={() => onFilterChange('query', MAP_FILTER_DEFAULTS.query)}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </aside>,
    document.body,
  )
}
