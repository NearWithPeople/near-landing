import { useMemo, useState } from 'react'

import { getCategoryEmoji } from '../../constants/vacancyCategories'
import {
  formatEmployerShiftsSubtitle,
  isActiveEmployerShift,
  isArchivedEmployerShift,
  normalizeEmployerShift,
} from '../../utils/employerShiftPresentation'
import '../ApplicationsPage/ApplicationsPage.css'
import './EmployerShiftsPage.css'

export { formatEmployerShiftsSubtitle }

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
}

export function EmployerShiftsPage({ vacancies = [], applications = [], onOpenShift, onCreateShift }) {
  const [showArchive, setShowArchive] = useState(false)
  const displayShifts = useMemo(
    () => vacancies.map((vacancy) => normalizeEmployerShift(vacancy, applications)),
    [applications, vacancies]
  )

  const activeShifts = displayShifts.filter((shift) => isActiveEmployerShift(shift))
  const archivedShifts = displayShifts.filter((shift) => isArchivedEmployerShift(shift))

  if (!displayShifts.length) {
    return (
      <section className="applicationsPage employerShiftsPage">
        <div className="applicationsPage__empty">
          <div className="applicationsPage__emptyVisual">📋</div>
          <h2>Смен пока нет</h2>
          <p>Создайте первую смену — она появится на карте и в этом разделе.</p>
          <button type="button" className="employerShiftsPage__createBtn" onClick={onCreateShift}>
            Создать смену
          </button>
        </div>
      </section>
    )
  }

  function renderShiftCard(shift) {
    const isCompact = shift.statusVariant === 'cancelled' || shift.statusVariant === 'completed'

    return (
      <article
        key={shift.id}
        className={`applicationCard applicationCard--${shift.statusVariant}${isCompact ? ' applicationCard--compact' : ''}`}
      >
        <button type="button" className="applicationCard__button" onClick={() => onOpenShift?.(shift.id)}>
          {isCompact ? (
            <div className="applicationCard__compactRow">
              <h3 className="applicationCard__title">{shift.vacancyTitle}</h3>
              <div className={`applicationCard__badge applicationCard__badge--${shift.statusVariant}`}>
                <span className="applicationCard__badgeDot" aria-hidden="true" />
                <span>{shift.statusLabel}</span>
              </div>
            </div>
          ) : (
            <div className="applicationCard__main">
              <div className="applicationCard__content">
                <h3 className="applicationCard__title">{shift.vacancyTitle}</h3>

                {shift.address ? (
                  <div className="applicationCard__info">
                    <img src="/map-icons/map-pin.png" alt="" className="applicationCard__infoIcon" />
                    <span>{shift.address}</span>
                  </div>
                ) : null}

                <div className="applicationCard__info">
                  <img src="/map-icons/losso.png" alt="" className="applicationCard__infoIcon" />
                  <span>{shift.salary}</span>
                </div>

                {shift.time ? (
                  <div className="applicationCard__info">
                    <img src="/map-icons/message-circle.png" alt="" className="applicationCard__infoIcon" />
                    <span>{shift.time}</span>
                  </div>
                ) : null}

                <div className="applicationCard__info">
                  <span className="employerShiftsPage__categoryEmoji" aria-hidden="true">
                    {getCategoryEmoji(shift.type || shift.category)}
                  </span>
                  <span>{formatApplicationCount(shift.applicationCount)}</span>
                </div>
              </div>

              <div className={`applicationCard__badge applicationCard__badge--${shift.statusVariant}`}>
                <span className="applicationCard__badgeDot" aria-hidden="true" />
                <span>{shift.statusLabel}</span>
              </div>
            </div>
          )}
        </button>
      </article>
    )
  }

  return (
    <section className="applicationsPage employerShiftsPage">
      <div className="applicationsPage__toolbar">
        <button type="button" className="employerShiftsPage__createBtn applicationsPage__statsBtn" onClick={onCreateShift}>
          + Создать смену
        </button>
        {archivedShifts.length ? (
          <button
            type="button"
            className={`applicationsPage__archiveBtn${showArchive ? ' applicationsPage__archiveBtn--active' : ''}`}
            aria-label="Архив"
            aria-pressed={showArchive}
            onClick={() => setShowArchive((prev) => !prev)}
          >
            <span aria-hidden="true">↺</span>
          </button>
        ) : null}
      </div>

      {activeShifts.length ? (
        <div className="employerShiftsPage__section">
          <div className="employerShiftsPage__sectionHead">
            <h3>Активные</h3>
            <span>{activeShifts.length}</span>
          </div>
          <div className="applicationsPage__list">{activeShifts.map(renderShiftCard)}</div>
        </div>
      ) : (
        <div className="applicationsPage__empty applicationsPage__empty--inline">
          <p>Нет активных смен. Завершённые — в архиве.</p>
        </div>
      )}

      {showArchive && archivedShifts.length ? (
        <div className="employerShiftsPage__section">
          <div className="employerShiftsPage__sectionHead">
            <h3>Архив</h3>
            <span>{archivedShifts.length}</span>
          </div>
          <div className="applicationsPage__list">{archivedShifts.map(renderShiftCard)}</div>
        </div>
      ) : null}
    </section>
  )
}
