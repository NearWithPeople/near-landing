export function ShiftRatingBlock({ label, value, interactive, disabled, onSelect }) {
  return (
    <div className="completedTaskRating">
      <div className="completedTaskRating__label">{label}</div>
      <div className={`completedTaskRating__stars ${interactive ? 'completedTaskRating__stars--interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value
          if (interactive) {
            return (
              <button
                key={n}
                type="button"
                className={`completedTaskRating__star ${active ? 'is-active' : ''}`}
                disabled={disabled}
                aria-label={`Оценка ${n} из 5`}
                onClick={() => onSelect(n)}
              >
                ★
              </button>
            )
          }
          return (
            <span key={n} className={`completedTaskRating__star ${active ? 'is-active' : ''} ${value == null ? 'is-muted' : ''}`} aria-hidden>
              ★
            </span>
          )
        })}
      </div>
    </div>
  )
}
