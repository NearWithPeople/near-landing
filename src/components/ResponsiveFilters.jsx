import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function ResponsiveFilters({ children, buttonLabel = 'Фильтры', buttonHint = '', mobileSheetPosition = 'bottom', desktopClassName = '', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className={`responsiveFilters ${className} ${isOpen ? 'is-open' : ''}`.trim()}>
      <div className={`filtersDesktop ${desktopClassName}`.trim()}>{children}</div>

      <div className="filtersMobile">
        <button type="button" className="filtersMobile__toggle" onClick={() => setIsOpen(true)}>
          <span className="filtersMobile__toggleLabel">{buttonLabel}</span>
          {buttonHint ? <span className="filtersMobile__toggleHint">{buttonHint}</span> : null}
        </button>

        {isOpen && typeof document !== 'undefined'
          ? createPortal(
              <div className={`filtersMobile__sheet filtersMobile__sheet--${mobileSheetPosition}`.trim()} role="dialog" aria-modal="true" aria-label={buttonLabel}>
                <button type="button" className="filtersMobile__backdrop" aria-label="Закрыть фильтры" onClick={() => setIsOpen(false)} />
                <div className={`filtersMobile__panel filtersMobile__panel--${mobileSheetPosition}`.trim()}>
                  <div className="filtersMobile__head">
                    <div className="filtersMobile__title">{buttonLabel}</div>
                    <button type="button" className="filtersMobile__close" onClick={() => setIsOpen(false)}>
                      Готово
                    </button>
                  </div>
                  <div className="filtersMobile__body">{children}</div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  )
}
