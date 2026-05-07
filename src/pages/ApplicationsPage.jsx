import { buildTelHref, buildTelegramHref } from '../utils/contactLinks'

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
          applications.map((application) => {
            const telHref = buildTelHref(application.employerPhone)
            const tgHref = buildTelegramHref(application.employerTelegram)

            const hasContacts = Boolean(telHref || tgHref)

            return (
              <article
                key={application.id}
                className={`reviewCard reviewCard--interactive ${!isEmployer && hasContacts ? 'reviewCard--contactHighlight' : ''}`}
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
                <div className="vacancyCard__meta">{isEmployer ? application.applicantName : application.employerName}</div>
                {!isEmployer ? (
                  <div
                    className={`applicationContactStrip ${hasContacts ? 'applicationContactStrip--prominent' : ''}`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {telHref ? (
                      <a className="applicationContactStrip__link" href={telHref}>
                        {application.employerPhone}
                      </a>
                    ) : null}
                    {telHref && tgHref ? <span className="applicationContactStrip__sep">·</span> : null}
                    {tgHref ? (
                      <a className="applicationContactStrip__link" href={tgHref} target="_blank" rel="noreferrer">
                        Telegram @{String(application.employerTelegram || '').replace(/^@+/, '')}
                      </a>
                    ) : null}
                    {!telHref && !tgHref ? <span className="applicationContactStrip__muted">Контакты появятся, когда работодатель укажет телефон или Telegram.</span> : null}
                  </div>
                ) : null}
                <div className="tagRow">
                  <span className={`tag ${application.status === 'approved' ? 'tag--accent' : ''}`}>{application.status}</span>
                  <span className="tag">{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </article>
            )
          })
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

