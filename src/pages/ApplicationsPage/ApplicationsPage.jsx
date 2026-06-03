import './ApplicationsPage.css'

const MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    vacancyTitle: 'Грузчик для переезда бренд-офиса',
    address: 'г. Минск, ул. Громова 30',
    salary: 'Оплата 45 Br за смену',
    time: 'с 08:00 по 12:00 2 июня 2026',
    status: 'active',
    statusLabel: 'Активен',
  },
  {
    id: 'app-2',
    vacancyTitle: 'Сотрудник бригады ресторана',
    address: 'г. Минск, ул. Ленина 15 (ТЦ "Galileo")',
    salary: 'Оплата от 70 Br за смену + питание',
    time: 'с 08:00 16 июня 2026 по 21:00 17 июня 2026',
    status: 'pending',
    statusLabel: 'Ожидает',
    requirements: [
      'Для работы необходима медсправка*',
      'Доступно с 14 лет с согласием законного представителя*'
    ]
  },
  {
    id: 'app-3',
    vacancyTitle: 'Волонтер на фестивале еды в ларьке',
    status: 'cancelled',
    statusLabel: 'Отменён',
  },
  {
    id: 'app-4',
    vacancyTitle: 'Волонтер на марафоне',
    status: 'cancelled',
    statusLabel: 'Отменён',
  },
  {
    id: 'app-5',
    vacancyTitle: 'Работник зеленого строительства',
    status: 'completed',
    statusLabel: 'Выполнен',
  }
]

export function ApplicationsPage({ currentUser, applications = [], onGoToCatalog, onOpenVacancy }) {
  const isEmployer = currentUser?.role === 'employer'
  const displayApplications = applications.length > 0 ? applications : MOCK_APPLICATIONS

  return (
    <section className="applicationsPage">
      <div className="applicationsHeader">
        <button className="statsButton">
          <img src="/map-icons/list.png" alt="" className="statsIcon" style={{filter: 'brightness(0) invert(1)'}} />
          Статистика
        </button>
        <button className="archiveButton">
          <img src="/map-icons/message-circle.png" alt="" className="archiveIcon" style={{filter: 'brightness(0) invert(1)'}} />
          Архив
        </button>
      </div>

      <div className="applicationsList">
        {displayApplications.map((app) => (
          <article key={app.id} className={`applicationCard applicationCard--${app.status}`}>
            <div className="applicationCard__main">
              <div className="applicationCard__content">
                <h3 className="applicationCard__title">{app.vacancyTitle}</h3>
                
                {app.address && (
                  <div className="applicationCard__info">
                    <img src="/map-icons/map-pin.png" alt="" className="infoIcon" />
                    <span>{app.address}</span>
                  </div>
                )}
                
                {app.salary && (
                  <div className="applicationCard__info">
                    <img src="/map-icons/losso.png" alt="" className="infoIcon" />
                    <span>{app.salary}</span>
                  </div>
                )}
                
                {app.time && (
                  <div className="applicationCard__info">
                    <img src="/map-icons/message-circle.png" alt="" className="infoIcon" />
                    <span>{app.time}</span>
                  </div>
                )}

                {app.requirements?.map((req, idx) => (
                  <div key={idx} className="applicationCard__requirement">
                    <img src="/map-icons/notepad-text.png" alt="" className="reqIcon" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>

              <div className={`statusBadge statusBadge--${app.status}`}>
                <span className="statusDot"></span>
                <span className="statusText">{app.statusLabel || app.status}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="primaryButton primaryButton--wide applicationsCatalogBtn" onClick={onGoToCatalog}>
        Открыть вакансии
      </button>
    </section>
  )
}
