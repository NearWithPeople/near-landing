import { useMemo } from 'react'

import { getCategoryEmoji, getCategoryLabel } from '../../constants/vacancyCategories'
import { formatActiveUntil } from '../../services/vacancyService'
import './EmployerShiftsPage.css'

function getVacancyStatusLabel(status) {
  if (status === 'pending_review') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  if (status === 'archived') return 'В архиве'
  if (status === 'closed') return 'Закрыта'
  if (status === 'paused') return 'На паузе'
  if (status === 'draft') return 'Черновик'
  return 'Открыта'
}

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
}

function isActiveShift(vacancy) {
  return vacancy.status === 'open' || !vacancy.status
}

export function formatEmployerShiftsSubtitle(vacancies = []) {
  const activeCount = vacancies.filter(isActiveShift).length

  if (!activeCount) return 'Нет активных смен'

  const mod10 = activeCount % 10
  const mod100 = activeCount % 100
  if (mod10 === 1 && mod100 !== 11) return `${activeCount} активная смена`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${activeCount} активные смены`
  return `${activeCount} активных смен`
}

export function EmployerShiftsPage({ vacancies = [], applications = [], onOpenShift, onCreateShift }) {
  const applicationCountByVacancy = useMemo(() => {
    const map = new Map()
    applications.forEach((application) => {
      if (!application.vacancyId) return
      map.set(application.vacancyId, (map.get(application.vacancyId) || 0) + 1)
    })
    return map
  }, [applications])

  const activeShifts = vacancies.filter(isActiveShift)
  const archivedShifts = vacancies.filter((vacancy) => !isActiveShift(vacancy))

  if (!vacancies.length) {
    return (
      <section className="employerShiftsPage">
        <div className="employerShiftsPage__empty">
          <div className="employerShiftsPage__emptyIcon" aria-hidden="true" />
          <h2>Смен пока нет</h2>
          <p>Создайте первую смену — она появится на карте и в этом разделе.</p>
          <button type="button" className="employerShiftsPage__createBtn" onClick={onCreateShift}>
            Создать смену
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="employerShiftsPage">
      <div className="employerShiftsPage__toolbar">
        <button type="button" className="employerShiftsPage__createBtn" onClick={onCreateShift}>
          + Создать смену
        </button>
      </div>

      {activeShifts.length ? (
        <div className="employerShiftsPage__section">
          <div className="employerShiftsPage__sectionHead">
            <h3>Активные</h3>
            <span>{activeShifts.length}</span>
          </div>
          <div className="employerShiftsPage__list">
            {activeShifts.map((vacancy) => {
              const applicationCount = applicationCountByVacancy.get(vacancy.id) || vacancy.applicationCount || 0

              return (
                <article key={vacancy.id} className="employerShiftCard">
                  <button type="button" className="employerShiftCard__button" onClick={() => onOpenShift?.(vacancy.id)}>
                    <div className="employerShiftCard__emoji">{getCategoryEmoji(vacancy.type || vacancy.category)}</div>
                    <div className="employerShiftCard__content">
                      <div className="employerShiftCard__top">
                        <h4>{vacancy.title}</h4>
                        <span className="employerShiftCard__status employerShiftCard__status--open">{getVacancyStatusLabel(vacancy.status)}</span>
                      </div>
                      <p className="employerShiftCard__category">{getCategoryLabel(vacancy.type || vacancy.category)}</p>
                      {vacancy.address ? <p className="employerShiftCard__meta">{vacancy.address}</p> : null}
                      <div className="employerShiftCard__facts">
                        <span>от {vacancy.payFrom} BYN</span>
                        <span>{vacancy.shiftDate || 'Дата уточняется'}</span>
                        <span>до {formatActiveUntil(vacancy.activeUntil, vacancy.activeUntilTime)}</span>
                      </div>
                      <p className="employerShiftCard__responses">{formatApplicationCount(applicationCount)}</p>
                    </div>
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}

      {archivedShifts.length ? (
        <div className="employerShiftsPage__section">
          <div className="employerShiftsPage__sectionHead">
            <h3>Архив</h3>
            <span>{archivedShifts.length}</span>
          </div>
          <div className="employerShiftsPage__list">
            {archivedShifts.map((vacancy) => (
              <article key={vacancy.id} className="employerShiftCard employerShiftCard--archived">
                <button type="button" className="employerShiftCard__button" onClick={() => onOpenShift?.(vacancy.id)}>
                  <div className="employerShiftCard__emoji">{getCategoryEmoji(vacancy.type || vacancy.category)}</div>
                  <div className="employerShiftCard__content">
                    <div className="employerShiftCard__top">
                      <h4>{vacancy.title}</h4>
                      <span className="employerShiftCard__status">{getVacancyStatusLabel(vacancy.status)}</span>
                    </div>
                    <p className="employerShiftCard__meta">{vacancy.address}</p>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
