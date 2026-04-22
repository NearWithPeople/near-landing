export function ApplicationsPage({ currentUser, applications, onGoToCatalog, onOpenVacancy }) {
  const isEmployer = currentUser.role === 'employer'

  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Отклики</div>
          <div className="panelHeader__title">{isEmployer ? 'Отклики на мои задачи' : 'Мои отклики'}</div>
        </div>
        <div className="statusBadge">{applications.length} записей</div>
      </div>

      <div className="reviewsGrid">
        {applications.length ? (
          applications.map((application) => (
            <article
              key={application.id}
              className="reviewCard reviewCard--interactive"
              role="button"
              tabIndex={0}
              onClick={() => onOpenVacancy(application.vacancyId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenVacancy(application.vacancyId)
                }
              }}
            >
              <div className="vacancyCard__title">{application.vacancyTitle}</div>
              <div className="vacancyCard__meta">
                {isEmployer ? application.applicantName : application.employerName}
              </div>
              <div className="tagRow">
                <span className={`tag ${application.status === 'approved' ? 'tag--accent' : ''}`}>{application.status}</span>
                <span className="tag">{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </article>
          ))
        ) : (
          <article className="reviewCard">
            <div className="reviewCard__text">Пока откликов нет. Начни с каталога и одной смены на день.</div>
          </article>
        )}
      </div>

      <button className="primaryButton primaryButton--wide mapPanel__catalogButton" onClick={onGoToCatalog}>
        Открыть вакансии
      </button>
    </section>
  )
}

