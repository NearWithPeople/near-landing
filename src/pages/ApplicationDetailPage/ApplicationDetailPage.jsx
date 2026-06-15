import { MapboxVacancyMap } from '../../components/MapboxVacancyMap'
import {
  APPLICATION_PROGRESS_STAGES,
  formatApplicationSalary,
  formatApplicationSchedule,
  normalizeApplication,
} from '../../utils/applicationPresentation'
import './ApplicationDetailPage.css'

export function ApplicationDetailPage({
  application,
  vacancy,
  onBack,
  onOpenChat,
  onCancel,
  onShowOnMap,
  onApply,
  hasApplied = false,
  emptyBackLabel = 'Назад к откликам',
  emptyMessage = 'Не найдено',
}) {
  const isApplicationMode = Boolean(application)

  if (!application && !vacancy) {
    return (
      <section className="applicationDetailPage">
        <div className="applicationDetailPage__empty">
          <p>{emptyMessage}</p>
          <button type="button" className="applicationDetailPage__ghostBtn" onClick={onBack}>
            {emptyBackLabel}
          </button>
        </div>
      </section>
    )
  }

  const item = application ? normalizeApplication(application) : null
  const title = vacancy?.title || item?.vacancyTitle
  const address = vacancy?.address || item?.address
  const salary = formatApplicationSalary(vacancy, item)
  const time = item?.time || formatApplicationSchedule(vacancy)
  const requirements = item?.requirements?.length ? item.requirements : vacancy?.requirements || []
  const description =
    item?.description ||
    vacancy?.description ||
    'Подробности смены появятся, когда работодатель заполнит описание вакансии.'
  const progressFilled = Math.max(0, Math.min(APPLICATION_PROGRESS_STAGES.length, item?.progressFilled || 0))
  const showApplicationActions = item && (item.statusVariant === 'pending' || item.statusVariant === 'active')
  const pageTitle = isApplicationMode ? 'Детали отклика' : 'Детали смены'

  return (
    <section className={`applicationDetailPage${isApplicationMode ? '' : ' applicationDetailPage--vacancy'}`}>
      <div className="applicationDetailPage__topbar">
        <button type="button" className="applicationDetailPage__back" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h1 className="applicationDetailPage__topTitle">{pageTitle}</h1>
        {item ? (
          <div className={`applicationDetailPage__statusBadge applicationDetailPage__statusBadge--${item.statusVariant}`}>
            <span className="applicationDetailPage__statusDot" aria-hidden="true" />
            <span>{item.statusLabel}</span>
          </div>
        ) : (
          <span className="applicationDetailPage__topSpacer" aria-hidden="true" />
        )}
      </div>

      <div className="applicationDetailPage__scroll">
        <article className="applicationDetailPage__card">
          <div className="applicationDetailPage__cardHead">
            <h2 className="applicationDetailPage__title">{title}</h2>
            <div className="applicationDetailPage__cardActions">
              <button type="button" className="applicationDetailPage__iconBtn" aria-label="SOS">
                SOS
              </button>
              <button type="button" className="applicationDetailPage__iconBtn applicationDetailPage__iconBtn--menu" aria-label="Меню">
                •••
              </button>
            </div>
          </div>

          {address ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/map-pin.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>{address}</span>
            </div>
          ) : null}

          <div className="applicationDetailPage__infoRow">
            <img src="/map-icons/losso.png" alt="" className="applicationDetailPage__infoIcon" />
            <span>{salary}</span>
          </div>

          {time ? (
            <div className="applicationDetailPage__infoRow">
              <img src="/map-icons/message-circle.png" alt="" className="applicationDetailPage__infoIcon" />
              <span>{time}</span>
            </div>
          ) : null}

          {vacancy ? (
            <div className="applicationDetailPage__mapWrap">
              <p className="applicationDetailPage__walkTime">~15 минут пешком</p>
              <button
                type="button"
                className="applicationDetailPage__mapCard"
                onClick={() => onShowOnMap?.(vacancy.id)}
                aria-label={`Открыть ${title} на карте`}
              >
                <MapboxVacancyMap
                  vacancies={[vacancy]}
                  selectedVacancyId={vacancy.id}
                  onSelect={() => {}}
                  centerPoint={{ lat: vacancy.lat, lng: vacancy.lng, zoom: 13 }}
                  className="applicationDetailPage__map"
                />
              </button>
            </div>
          ) : null}

          {requirements.map((requirement) => (
            <div key={requirement} className="applicationDetailPage__requirement">
              <span className="applicationDetailPage__check" aria-hidden="true" />
              <span>{requirement}</span>
            </div>
          ))}

          <div className="applicationDetailPage__description">{description}</div>
        </article>
      </div>

      {isApplicationMode ? (
        <div className="applicationDetailPage__bottomPanel">
          <div className="applicationDetailPage__panelHead">
            <p className="applicationDetailPage__panelTitle">{item.panelTitle}</p>
            {item.panelSubtitle ? <p className="applicationDetailPage__panelSubtitle">{item.panelSubtitle}</p> : null}
          </div>

          <div className="applicationDetailPage__progress">
            <div className="applicationDetailPage__progressTrack" aria-hidden="true">
              {APPLICATION_PROGRESS_STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`applicationDetailPage__progressSegment${
                    index < progressFilled ? ' applicationDetailPage__progressSegment--filled' : ''
                  }`}
                />
              ))}
            </div>
            <div className="applicationDetailPage__progressLabels">
              {APPLICATION_PROGRESS_STAGES.map((stage) => (
                <span key={stage.id}>{stage.label}</span>
              ))}
            </div>
          </div>

          {item.progressDetailText ? <p className="applicationDetailPage__progressDetail">{item.progressDetailText}</p> : null}

          {showApplicationActions ? (
            <div className="applicationDetailPage__actions">
              <button type="button" className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--ghost" onClick={onCancel}>
                <span aria-hidden="true">×</span>
                Отказаться
              </button>
              <button type="button" className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary" onClick={onOpenChat}>
                <img src="/map-icons/message-circle.png" alt="" />
                Перейти в чат
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="applicationDetailPage__bottomPanel applicationDetailPage__bottomPanel--vacancy">
          <button
            type="button"
            className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary applicationDetailPage__actionBtn--full"
            onClick={onApply}
            disabled={hasApplied}
          >
            {hasApplied ? 'Отклик отправлен' : 'Откликнуться'}
          </button>
        </div>
      )}
    </section>
  )
}
