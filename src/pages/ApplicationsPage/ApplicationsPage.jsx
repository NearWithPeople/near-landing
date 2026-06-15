import {
  formatApplicationSalary,
  getDisplayApplications,
  normalizeApplication,
} from '../../utils/applicationPresentation'
import './ApplicationsPage.css'

export function ApplicationsPage({ currentUser, applications = [], onOpenApplication }) {
  const displayApplications = getDisplayApplications(applications).map(normalizeApplication)

  return (
    <section className="applicationsPage">
      <div className="applicationsPage__toolbar">
        <button type="button" className="applicationsPage__statsBtn">
          <img src="/map-icons/list.png" alt="" className="applicationsPage__statsIcon" />
          Статистика
        </button>
        <button type="button" className="applicationsPage__archiveBtn" aria-label="Архив">
          <span aria-hidden="true">↺</span>
        </button>
      </div>

      <div className="applicationsPage__list">
        {displayApplications.map((app) => {
          const isCompact = app.statusVariant === 'cancelled' || app.statusVariant === 'completed'

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
        })}
      </div>
    </section>
  )
}
