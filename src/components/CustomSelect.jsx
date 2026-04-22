import { useEffect, useId, useMemo, useRef, useState } from 'react'

export function CustomSelect({
  value,
  options,
  onChange,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  isClearable = false,
  isActive = false,
  onClear,
  clearAriaLabel = 'Сбросить фильтр',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const listboxId = useId()

  const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? options[0], [options, value])

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className={`customSelect ${isOpen ? 'is-open' : ''} ${isClearable && isActive ? 'has-clear' : ''} ${className}`.trim()}>
      <button
        type="button"
        className={`customSelect__trigger ${triggerClassName}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="customSelect__label">{selectedOption?.label}</span>
        <span className="customSelect__chevron" aria-hidden />
      </button>

      {isClearable && isActive ? (
        <button
          type="button"
          className="customSelect__clear"
          aria-label={clearAriaLabel}
          onClick={(event) => {
            event.stopPropagation()
            setIsOpen(false)
            onClear?.()
          }}
        >
          <span aria-hidden>&times;</span>
        </button>
      ) : null}

      {isOpen ? (
        <div className={`customSelect__menu ${menuClassName}`.trim()} role="listbox" id={listboxId}>
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`customSelect__option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <span className="customSelect__check">Выбрано</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
