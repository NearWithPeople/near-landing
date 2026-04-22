import { MapboxVacancyMap } from '../components/MapboxVacancyMap'

function getVacancyDescription(vacancy) {
  return [
    `${vacancy.companyName} ищет специалиста на позицию "${vacancy.title}". Это смена в формате "${vacancy.schedule}" с оплатой от ${vacancy.payFrom} BYN и выходом ${vacancy.shiftDate.toLowerCase()}.`,
    `Работа проходит по адресу ${vacancy.address}. Подойдет кандидатам, которым важны понятные задачи, быстрый старт и прозрачные условия на один день.`,
    `Работодатель ожидает вовлеченность, пунктуальность и готовность выйти на смену по профилю "${vacancy.type}". Если формат тебе подходит, можно откликнуться прямо со страницы вакансии.`,
  ]
}

function formatApplicationCount(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} отклик`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} отклика`
  return `${count} откликов`
}

export function VacancyPage({ vacancy, currentUser, hasApplied, onApply, onBackToCatalog, onOpenVacancy, onShowOnMap, relatedVacancies }) {
  if (!vacancy) {
    return (
      <section className="reviewsPage">
        <article className="reviewCard">
          <div className="panelHeader__title">Вакансия не найдена</div>
          <div className="reviewCard__text">Проверь ссылку или вернись в каталог, чтобы выбрать актуальную вакансию.</div>
        </article>
        <button className="primaryButton primaryButton--wide mapPanel__catalogButton" onClick={onBackToCatalog}>
          Вернуться в каталог
        </button>
      </section>
    )
  }

  const canApply = currentUser.role === 'user'
  const description = getVacancyDescription(vacancy)

  return (
    <section className="vacancyDetailPage">
      <div className="vacancyDetailLayout">
        <div className="vacancyDetailMain">
          <article className="vacancyDetailCard">
            <div className="vacancyDetailCard__title">{vacancy.title}</div>
            <div className="vacancyDetailCard__salary">от {vacancy.payFrom} BYN за смену</div>

            <div className="vacancyDetailFacts">
              <div className="vacancyDetailFacts__item">Выплаты: после смены</div>
              <div className="vacancyDetailFacts__item">Формат: {vacancy.schedule}</div>
              <div className="vacancyDetailFacts__item">Дата: {vacancy.shiftDate}</div>
              <div className="vacancyDetailFacts__item">Длительность: {vacancy.duration}</div>
              <div className="vacancyDetailFacts__item">Категория: {vacancy.type}</div>
              <div className="vacancyDetailFacts__item">Расстояние: {vacancy.distanceKm.toFixed(1)} км</div>
              <div className="vacancyDetailFacts__item">Откликнулось: {formatApplicationCount(vacancy.applicationCount)}</div>
            </div>

            <div className="vacancyDetailActions">
              {canApply ? (
                <button className="primaryButton vacancyDetailActions__primary" onClick={() => onApply(vacancy.id)} disabled={hasApplied}>
                  {hasApplied ? 'Отклик уже отправлен' : 'Откликнуться'}
                </button>
              ) : (
                <button className="ghostButton vacancyDetailActions__primary" disabled>
                  Работодатель не может откликаться
                </button>
              )}
              <button className="ghostButton" onClick={onBackToCatalog}>
                Назад к вакансиям
              </button>
            </div>
          </article>

          <article className="vacancyDetailSection">
            <div className="panelHeader__title">Описание вакансии</div>
            <div className="vacancyDetailText">
              {description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <article className="vacancyDetailSection">
            <div className="panelHeader__title">Где предстоит работать</div>
            <div className="vacancyDetailText">
              <p>{vacancy.address}</p>
            </div>
            <div className="tagRow">
              <span className="tag tag--accent">{vacancy.type}</span>
              <span className="tag">{vacancy.shiftDate}</span>
              <span className="tag">{vacancy.schedule}</span>
              {(vacancy.tags || []).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button className="vacancyDetailMapButton" type="button" onClick={() => onShowOnMap(vacancy.id)}>
              Показать на большой карте
            </button>
            <button className="vacancyDetailMapCard" type="button" onClick={() => onShowOnMap(vacancy.id)} aria-label={`Открыть вакансию ${vacancy.title} на карте`}>
              <MapboxVacancyMap
                vacancies={[vacancy]}
                selectedVacancyId={vacancy.id}
                onSelect={() => {}}
                centerPoint={{ lat: vacancy.lat, lng: vacancy.lng, zoom: 13 }}
                className="vacancyDetailMap"
              />
            </button>
          </article>
        </div>

        <aside className="vacancyDetailSidebar">
          <article className="vacancyDetailCompany">
            <div className="vacancyDetailCompany__name">{vacancy.companyName}</div>
            <div className="vacancyDetailCompany__meta">Опубликовано для соискателей платформы "Рядом"</div>
          </article>

          <div className="vacancyDetailRelated">
            <div className="vacancyDetailRelated__title">Похожие вакансии</div>
            <div className="vacancyDetailRelated__list">
              {relatedVacancies.map((item) => (
                <article key={item.id} className="vacancyDetailRelated__card" onClick={() => onOpenVacancy(item.id)} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpenVacancy(item.id)}>
                  <div className="vacancyCard__title">{item.title}</div>
                  <div className="vacancyCard__meta">{item.companyName}</div>
                  <div className="tagRow">
                    <span className="tag tag--accent">от {item.payFrom} BYN</span>
                    <span className="tag">{item.type}</span>
                    <span className="tag">{formatApplicationCount(item.applicationCount)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
