import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function ResponsiveFilters({
  children,
  buttonLabel = 'Фильтры',
  buttonHint = '',
  mobileSheetPosition = 'bottom',
  desktopClassName = '',
  className = '',
  isOpen,
  onOpenChange,
  hideMobileToggle = false,
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen ?? internalOpen

  function setOpen(nextValue) {
    if (onOpenChange) {
      onOpenChange(nextValue)
      return
    }
    setInternalOpen(nextValue)
  }

  useEffect(() => {
    if (!open) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className={`responsiveFilters ${className} ${open ? 'is-open' : ''}${hideMobileToggle ? ' responsiveFilters--externalToggle' : ''}`.trim()}>
      <div className={`filtersDesktop ${desktopClassName}`.trim()}>{children}</div>

      <div className="filtersMobile">
        {!hideMobileToggle ? (
          <button type="button" className="filtersMobile__toggle" onClick={() => setOpen(true)}>
            <span className="filtersMobile__toggleLabel">{buttonLabel}</span>
            {buttonHint ? <span className="filtersMobile__toggleHint">{buttonHint}</span> : null}
          </button>
        ) : null}

        {open && typeof document !== 'undefined'
          ? createPortal(
              <div className={`filtersMobile__sheet filtersMobile__sheet--${mobileSheetPosition}`.trim()} role="dialog" aria-modal="true" aria-label={buttonLabel}>
                <button type="button" className="filtersMobile__backdrop" aria-label="Закрыть фильтры" onClick={() => setOpen(false)} />
                <div className={`filtersMobile__panel filtersMobile__panel--${mobileSheetPosition}`.trim()}>
                  <div className="filtersMobile__head">
                    <div className="filtersMobile__title">{buttonLabel}</div>
                    <button type="button" className="filtersMobile__close" onClick={() => setOpen(false)}>
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
