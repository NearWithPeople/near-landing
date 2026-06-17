import { formatRatingLabel, getSeekerRatingSummary } from '../../utils/ratings'
import './UserProfilePage.css'

export function UserProfilePage({ user, completedTasks = [], onBack }) {
  if (!user) {
    return (
      <section className="userProfilePage">
        <p className="userProfilePage__empty">Профиль не найден</p>
      </section>
    )
  }

  const ratingSummary = getSeekerRatingSummary({
    completedTasks,
    userId: user.id,
  })

  return (
    <section className="userProfilePage">
      <div className="userProfilePage__topbar">
        <button type="button" className="userProfilePage__back" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <h1 className="userProfilePage__title">Профиль исполнителя</h1>
      </div>

      <div className="userProfilePage__hero">
        <div className="userProfilePage__avatar">{(user.fullName || 'И')[0]}</div>
        <div>
          <h2>{user.fullName || 'Исполнитель'}</h2>
          <p className="userProfilePage__rating">{formatRatingLabel(ratingSummary.rating, ratingSummary.count)}</p>
          {user.age ? <p className="userProfilePage__meta">Возраст: {user.age}</p> : null}
        </div>
      </div>

      {user.review ? (
        <section className="userProfilePage__section">
          <h3>О себе</h3>
          <p>{user.review}</p>
        </section>
      ) : null}

      <section className="userProfilePage__section">
        <div className="userProfilePage__sectionHead">
          <h3>Отзывы работодателей</h3>
          <span>{ratingSummary.reviews.length}</span>
        </div>
        <div className="userProfilePage__reviews">
          {ratingSummary.reviews.length ? (
            ratingSummary.reviews.map((review) => (
              <article key={review.id} className="userProfilePage__reviewCard">
                <div className="userProfilePage__reviewHead">
                  <strong>{review.authorName}</strong>
                  {review.rating ? <span>★ {review.rating}</span> : null}
                </div>
                <p>{review.text}</p>
              </article>
            ))
          ) : (
            <p className="userProfilePage__empty">Отзывов пока нет.</p>
          )}
        </div>
      </section>
    </section>
  )
}
