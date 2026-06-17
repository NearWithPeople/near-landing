import { useMemo, useState } from 'react'

import {
  formatApplicationSalary,
  getDisplayApplications,
  normalizeApplication,
} from '../../utils/applicationPresentation'
import './ApplicationsPage.css'

function isActiveApplication(app) {
  return app.statusVariant === 'active' || app.statusVariant === 'pending'
}

function isArchivedApplication(app) {
  return app.statusVariant === 'completed' || app.statusVariant === 'cancelled'
}

export function ApplicationsPage({ currentUser, applications = [], onOpenApplication }) {
  const displayApplications = useMemo(
    () => getDisplayApplications(applications).map(normalizeApplication),
    [applications]
  )
  const [showArchive, setShowArchive] = useState(false)

  const activeApplications = displayApplications.filter(isActiveApplication)
  const archivedApplications = displayApplications.filter(isArchivedApplication)

  if (!displayApplications.length) {
    return (
      <section className="applicationsPage">
        <div className="applicationsPage__empty">
          <div className="applicationsPage__emptyVisual">📋</div>
          <h2>Пока нет откликов</h2>
          <p>Откликнитесь на смену на карте — здесь появятся ваши заявки и их статусы.</p>
        </div>
      </section>
    )
  }

  function renderApplicationCard(app) {
    const isCompact = isArchivedApplication(app)

    return (
      <article
        key={app.id}
        className={`applicationCard applicationCard--${app.statusVariant}${isCompact ? ' applicationCard--compact' : ''}`}
      >
        <button type="button" className="applicationCard__button" onClick={() => onOpenApplication?.(app.id)}>
          {isCompact ? (
            <div className="applicationCard__compactRow">
              <h3 className="applicationCard__title">{app.vacancyTitle}</h3>
              <div className={`applicationCard__badge applicationCard__badge--${app.statusVariant}`}>
                <span className="applicationCard__badgeDot" aria-hidden="true" />
                <span>{app.statusLabel}</span>
              </div>
            </div>
          ) : (
            <div className="applicationCard__main">
              <div className="applicationCard__content">
                <h3 className="applicationCard__title">{app.vacancyTitle}</h3>

                {app.address ? (
                  <div className="applicationCard__info">
                    <img src="/map-icons/map-pin.png" alt="" className="applicationCard__infoIcon" />
                    <span>{app.address}</span>
                  </div>
                ) : null}

                <div className="applicationCard__info">
                  <img src="/map-icons/losso.png" alt="" className="applicationCard__infoIcon" />
                  <span>{app.salary || formatApplicationSalary(null, app)}</span>
                </div>

                {app.time ? (
                  <div className="applicationCard__info">
                    <img src="/map-icons/message-circle.png" alt="" className="applicationCard__infoIcon" />
                    <span>{app.time}</span>
                  </div>
                ) : null}

                {app.requirements?.map((requirement) => (
                  <div key={requirement} className="applicationCard__requirement">
                    <span className="applicationCard__check" aria-hidden="true" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </div>

              <div className={`applicationCard__badge applicationCard__badge--${app.statusVariant}`}>
                <span className="applicationCard__badgeDot" aria-hidden="true" />
                <span>{app.statusLabel}</span>
              </div>
            </div>
          )}
        </button>
      </article>
    )
  }

  return (
    <section className="applicationsPage">
      <div className="applicationsPage__toolbar">
        <button type="button" className="applicationsPage__statsBtn">
          <img src="/map-icons/list.png" alt="" className="applicationsPage__statsIcon" />
          {activeApplications.length ? `${activeApplications.length} активных` : 'Статистика'}
        </button>
        <button
          type="button"
          className={`applicationsPage__archiveBtn${showArchive ? ' applicationsPage__archiveBtn--active' : ''}`}
          aria-label="Архив"
          aria-pressed={showArchive}
          onClick={() => setShowArchive((prev) => !prev)}
        >
          <span aria-hidden="true">↺</span>
        </button>
      </div>

      {activeApplications.length ? (
        <div className="applicationsPage__list">{activeApplications.map(renderApplicationCard)}</div>
      ) : (
        <div className="applicationsPage__empty applicationsPage__empty--inline">
          <p>Нет активных откликов. Завершённые и отменённые — в архиве.</p>
        </div>
      )}

      {showArchive && archivedApplications.length ? (
        <div className="applicationsPage__archiveSection">
          <div className="applicationsPage__archiveHead">
            <h3>Архив</h3>
            <span>{archivedApplications.length}</span>
          </div>
          <div className="applicationsPage__list">{archivedApplications.map(renderApplicationCard)}</div>
        </div>
      ) : null}
    </section>
  )
}
