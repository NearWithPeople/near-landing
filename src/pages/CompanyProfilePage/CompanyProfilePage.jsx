import { getCategoryEmoji, getCategoryLabel } from '../../constants/vacancyCategories'
import { formatRatingLabel, getEmployerRatingSummary } from '../../utils/ratings'
import './CompanyProfilePage.css'

export function CompanyProfilePage({
  ownerId,
  vacancies = [],
  completedTasks = [],
  onBack,
  onOpenVacancy,
  onOpenMapVacancy,
}) {
  const companyVacancies = vacancies.filter(
    (vacancy) => String(vacancy.ownerId) === String(ownerId) && vacancy.status === 'open'
  )
  const companyName = companyVacancies[0]?.companyName || vacancies.find((vacancy) => String(vacancy.ownerId) === String(ownerId))?.companyName || 'Компания'
  const ratingSummary = getEmployerRatingSummary({
    completedTasks,
    vacancies,
    ownerId,
    employerName: companyName,
  })
  const primaryCategory = companyVacancies[0]?.type || companyVacancies[0]?.category

  return (
    <section className="companyProfilePage">
      <div className="companyProfilePage__topbar">
        <button type="button" className="companyProfilePage__back" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h1 className="companyProfilePage__title">Профиль компании</h1>
      </div>

      <div className="companyProfilePage__hero">
        <div className="companyProfilePage__avatar">{getCategoryEmoji(primaryCategory)}</div>
        <div className="companyProfilePage__heroInfo">
          <h2>{companyName}</h2>
          <p className="companyProfilePage__rating">{formatRatingLabel(ratingSummary.rating, ratingSummary.count)}</p>
          {primaryCategory ? <p className="companyProfilePage__category">{getCategoryLabel(primaryCategory)}</p> : null}
        </div>
      </div>

      <section className="companyProfilePage__section">
        <div className="companyProfilePage__sectionHead">
          <h3>Открытые смены</h3>
          <span>{companyVacancies.length}</span>
        </div>
        <div className="companyProfilePage__vacancies">
          {companyVacancies.length ? (
            companyVacancies.map((vacancy) => (
              <button
                key={vacancy.id}
                type="button"
                className="companyProfilePage__vacancyCard"
                onClick={() => onOpenMapVacancy?.(vacancy.id)}
              >
                <div className="companyProfilePage__vacancyEmoji">{getCategoryEmoji(vacancy.type || vacancy.category)}</div>
                <div className="companyProfilePage__vacancyMain">
                  <div className="companyProfilePage__vacancyTitle">{vacancy.title}</div>
                  <div className="companyProfilePage__vacancyMeta">от {vacancy.payFrom} Br · {vacancy.shiftDate}</div>
                  <div className="companyProfilePage__vacancyAddress">{vacancy.address}</div>
                </div>
              </button>
            ))
          ) : (
            <p className="companyProfilePage__empty">Сейчас нет открытых смен от этой компании.</p>
          )}
        </div>
      </section>

      <section className="companyProfilePage__section">
        <div className="companyProfilePage__sectionHead">
          <h3>Отзывы исполнителей</h3>
          <span>{ratingSummary.reviews.length}</span>
        </div>
        <div className="companyProfilePage__reviews">
          {ratingSummary.reviews.length ? (
            ratingSummary.reviews.map((review) => (
              <article key={review.id} className="companyProfilePage__reviewCard">
                <div className="companyProfilePage__reviewHead">
                  <strong>{review.authorName}</strong>
                  {review.rating ? <span>★ {review.rating}</span> : null}
                </div>
                <p>{review.text}</p>
                {review.vacancyTitle ? <span className="companyProfilePage__reviewMeta">{review.vacancyTitle}</span> : null}
              </article>
            ))
          ) : (
            <p className="companyProfilePage__empty">Отзывов пока нет — они появятся после завершённых смен.</p>
          )}
        </div>
      </section>
    </section>
  )
}
