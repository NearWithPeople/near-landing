export function ProfilePage({ currentUser, completedTasks, employerVacancies, onGoToCatalog }) {
  const isEmployer = currentUser.role === 'employer'

  return (
    <section className="reviewsPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Профиль</div>
          <div className="panelHeader__title">{currentUser.companyName || currentUser.fullName}</div>
        </div>
        <div className="statusBadge">{isEmployer ? 'работодатель' : 'исполнитель'}</div>
      </div>

      {!isEmployer ? (
        <div className="reviewsGrid">
          {completedTasks.length ? (
            completedTasks.map((task) => (
              <article key={task.id} className="reviewCard">
                <div className="vacancyCard__title">{task.title}</div>
                <div className="vacancyCard__meta">
                  {task.employerName} • {task.address}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">{task.pay} BYN</span>
                  <span className="tag">{task.duration}</span>
                  <span className="tag">{new Date(task.completedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="reviewCard__text">{task.summary}</div>
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Пока нет выполненных задач. После первой смены они появятся здесь.</div>
            </article>
          )}
        </div>
      ) : (
        <div className="reviewsGrid">
          {employerVacancies.length ? (
            employerVacancies.map((vacancy) => (
              <article key={vacancy.id} className="reviewCard">
                <div className="vacancyCard__title">{vacancy.title}</div>
                <div className="vacancyCard__meta">
                  {vacancy.address} • {vacancy.type}
                </div>
                <div className="tagRow">
                  <span className="tag tag--accent">от {vacancy.payFrom} BYN</span>
                  <span className="tag">{vacancy.duration}</span>
                  <span className="tag">{vacancy.schedule}</span>
                </div>
              </article>
            ))
          ) : (
            <article className="reviewCard">
              <div className="reviewCard__text">Пока нет опубликованных задач. Все задания здесь считаются сменами на один день.</div>
            </article>
          )}
        </div>
      )}

      <button className="primaryButton primaryButton--wide mapPanel__catalogButton" onClick={onGoToCatalog}>
        Перейти к каталогу
      </button>
    </section>
  )
}

