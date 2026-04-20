export function CatalogPage({ filters, onFilterChange, vacancies, onShowMap }) {
  return (
    <section className="catalogPage">
      <div className="catalogFilters">
        <input
          className="input input--dark"
          placeholder="Поиск по вакансиям"
          value={filters.query}
          onChange={(e) => onFilterChange('query', e.target.value)}
        />
        <select className="input input--dark" value={String(filters.payMin)} onChange={(e) => onFilterChange('payMin', Number(e.target.value))}>
          <option value="0">Любая ставка</option>
          <option value="40">От 40 BYN</option>
          <option value="60">От 60 BYN</option>
          <option value="80">От 80 BYN</option>
        </select>
        <select className="input input--dark" value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}>
          <option value="all">Все категории</option>
          <option value="Курьер">Курьер</option>
          <option value="Склад">Склад</option>
          <option value="Промо">Промо</option>
          <option value="HoReCa">HoReCa</option>
        </select>
      </div>

      <div className="catalogList">
        {vacancies.map((vacancy) => (
          <div key={vacancy.id} className="catalogRow">
            <div>
              <div className="vacancyCard__title">{vacancy.title}</div>
              <div className="vacancyCard__meta">
                {vacancy.companyName} • {vacancy.address}
              </div>
            </div>
            <div className="catalogRow__side">
              <div className="tagRow">
                <span className="tag tag--accent">от {vacancy.payFrom} BYN</span>
                <span className="tag">{vacancy.distanceKm.toFixed(1)} км</span>
                <span className="tag">{vacancy.duration}</span>
              </div>
              <div className="catalogRow__type">
                {vacancy.type} • {vacancy.schedule}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="primaryButton primaryButton--wide mapPanel__catalogButton" onClick={onShowMap}>
        Перейти к карте
      </button>
    </section>
  )
}

