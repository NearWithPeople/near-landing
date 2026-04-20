import { MapboxVacancyMap } from '../components/MapboxVacancyMap'

export function AppMapPage({ vacancies, selectedVacancyId, onSelect, onShowCatalog }) {
  const active = vacancies.find((vacancy) => vacancy.id === selectedVacancyId) || vacancies[0] || null

  return (
    <section className="pageGrid">
      <div className="mapPanel">
        <div className="panelHeader">
          <div>
            <div className="panelHeader__eyebrow">Карта</div>
            <div className="panelHeader__title">Все вакансии рядом</div>
          </div>
          <div className="statusBadge">Mapbox</div>
        </div>

        <MapboxVacancyMap vacancies={vacancies} selectedVacancyId={selectedVacancyId} onSelect={onSelect} className="mapPlaceholder" />

        {active ? (
          <div className="spotlightCard">
            <div className="spotlightCard__title">{active.title}</div>
            <div className="spotlightCard__meta">
              {active.companyName} • {active.address}
            </div>
            <div className="tagRow">
              <span className="tag tag--accent">от {active.payFrom} BYN</span>
              <span className="tag">{active.duration}</span>
              <span className="tag">{active.type}</span>
              <span className="tag">{active.schedule}</span>
            </div>
          </div>
        ) : null}

        <button className="primaryButton primaryButton--wide mapPanel__catalogButton" onClick={onShowCatalog}>
          Показать каталог
        </button>
      </div>

      <div className="sidePanel">
        <div className="panelHeader">
          <div className="panelHeader__title">Рядом с вами</div>
          <div className="panelHeader__eyebrow">{vacancies.length} вакансий</div>
        </div>
        <div className="vacancyList">
          {vacancies.map((vacancy) => (
            <button key={vacancy.id} className={`vacancyCard ${selectedVacancyId === vacancy.id ? 'is-active' : ''}`} onClick={() => onSelect(vacancy.id)}>
              <div className="vacancyCard__title">{vacancy.title}</div>
              <div className="vacancyCard__meta">
                {vacancy.companyName} • {vacancy.address}
              </div>
              <div className="tagRow">
                <span className="tag tag--accent">от {vacancy.payFrom} BYN</span>
                <span className="tag">{vacancy.duration}</span>
                <span className="tag">{vacancy.distanceKm.toFixed(1)} км</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

