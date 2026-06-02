import './ReviewsPage.css'

export function ReviewsPage({ reviews, currentUser }) {
  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Отзывы</div>
          <div className="panelHeader__title">Что пишут о платформе</div>
        </div>
      </div>

      <div className="reviewsGrid">
        {reviews.map((review) => (
          <article key={review.id} className="reviewCard">
            <div className="reviewCard__rating">{'★'.repeat(review.rating)}</div>
            <div className="reviewCard__text">{review.text}</div>
            <div className="reviewCard__meta">
              {review.authorName} • {review.authorRole} • {review.targetName}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

